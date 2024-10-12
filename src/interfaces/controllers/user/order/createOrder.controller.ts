import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import Order, {
  IOrder,
  OrderPaymentMethod,
  OrderPaymentStatus,
} from '../../../../infrastructure/database/models/OrderSchema';
import mongoose, { ObjectId } from 'mongoose';
import Razorpay from 'razorpay';
import env from '../../../../infrastructure/env/env';
import { checkHomeDeliveryAvailability } from '../../../../application/usecases/CheckHomeDeliveryAvailability';
import { ShopRepository } from '../../../../infrastructure/repositories/ShopRepository';
import { CartRepository } from '../../../../infrastructure/repositories/CartRepository';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import UserRepository from '../../../../infrastructure/repositories/UserRepository';
import Shop, {
  IShop,
} from '../../../../infrastructure/database/models/ShopSchema';
import { assignDeliveryPartnerForOrder } from '../../../../infrastructure/services/partnerAssignmentService';
import { clearCart } from './verifyPayment.controller';
import { discountUseCase } from '../../../../application/usecases/discountUsecase';
import { calculateDeliveryCharge } from '../../../../infrastructure/services/calculateDeliveryChargeService';

interface Variant {
  _id: mongoose.Schema.Types.ObjectId;
  price: number;
  discountedPrice: number;
  stock: number;
}

interface Product {
  _id: mongoose.Schema.Types.ObjectId;
  variants: Variant[];
  storeId: mongoose.Schema.Types.ObjectId;
  name: string;
}

interface CartWithTotal {
  products: IOrder['items'];
  totalAmount: number;
  storeId: mongoose.Schema.Types.ObjectId;
}

interface EnrichWithPriceReturn {
  cart: CartWithTotal | null;
  outOfStockProducts: string[];
}

const cartRepository = new CartRepository();
const shopRepository = new ShopRepository();

export default async function createOrder(req: Request, res: Response) {
  try {
    const { longitude, latitude, useWallet, couponCode } = req.body;
    console.log(req.body);
    const userId: ObjectId = req.user._id;

    const result = await checkHomeDeliveryAvailability(
      userId,
      { longitude: longitude, latitude: latitude },
      10000,
      cartRepository,
      shopRepository
    );

    // Get product IDs for unavailable (not near) and available (near) products
    const unavailableProductIds = result.notNearProducts.map(
      (product) => product.productId
    );

    const availableProductIds = result.nearProducts.map(
      (product) => product.productId
    );

    const allProductIds = [...unavailableProductIds, ...availableProductIds];
    const allProducts = await StoreProducts.find(
      { _id: { $in: allProductIds } },
      { name: 1, images: 1 }
    ).lean();

    const unavailableProducts = allProducts.filter((product) =>
      unavailableProductIds.includes(product._id)
    );
    const availableProducts = allProducts.filter((product) =>
      availableProductIds.includes(product._id)
    );

    // Check if there are unavailable products
    if (unavailableProducts.length > 0) {
      return res.status(400).json({
        message: 'Some products are not deliverable to your location.',
        unavailableProducts,
        availableProducts,
      });
    }

    // Proceed to enrich cart with price and out-of-stock checks
    const { cart, outOfStockProducts } = await enrichWithPrice(userId);

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ message: 'Add products to cart to buy' });
    }

    // adding platform fees
    cart.totalAmount += 16;

    const [storeLng, storeLat] = cart.products[0].storeLocation.coordinates;
    let deliveryCharge = 0;

    try {
      // Calculate the delivery charge using the store and user locations
      deliveryCharge = await calculateDeliveryCharge(
        `${storeLat},${storeLng}`,
        `${latitude},${longitude}`
      );

      cart.totalAmount += deliveryCharge;
    } catch (error) {
      console.error('Error calculating delivery charge:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const couponApplied = {};

    if (couponCode) {
      couponApplied.code = couponCode;

      const afterCouponApplied = await discountUseCase.apply(
        userId,
        couponCode,
        cart.totalAmount
      );

      console.log(couponCode, afterCouponApplied);

      couponApplied.discount = afterCouponApplied.discount;
      couponApplied.minOrderValue = afterCouponApplied.minOrderValue;

      cart.totalAmount = afterCouponApplied.finalAmount;
    }

    let payableAmount = cart.totalAmount;

    if (useWallet) {
      const walletBalance = await new UserRepository().getWalletBalance(userId);
      if (walletBalance < payableAmount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      payableAmount = Math.max(0, payableAmount - walletBalance);
    }

    // Create the order using the enriched cart data
    const newOrder = await Order.create({
      userId,
      items: cart.products.map((product) => ({
        productId: product.productId,
        variantId: product.variantId,
        quantity: product.quantity,
        price: Math.round(product.price),
        storeId: product.storeId,
        productName: product.name,
      })),
      payableAmount: Math.round(payableAmount),
      totalAmount: Math.round(cart.totalAmount),
      paymentStatus: 'Pending',
      paymentId: null,
      paymentMethod: 'Razorpay',
      deliveryLocation: {
        coordinates: [longitude, latitude],
      },
      couponApplied,
      deliveryCharge,
      platformFee: 16,
    });

    if (!payableAmount) {
      await new UserRepository().debitMoneyFromWallet(cart.totalAmount, userId);

      // Handle delivery assignment, then finalize the order:
      newOrder.paymentStatus = OrderPaymentStatus.Completed;
      newOrder.paymentMethod = OrderPaymentMethod.Wallet;
      await newOrder.save();

      const storeId = newOrder.items[0].storeId;
      const store = (await Shop.findById(storeId).lean()) as IShop;
      const storeLocation = store.location;

      assignDeliveryPartnerForOrder({
        orderId: newOrder._id as string,
        storeLongitude: storeLocation.coordinates[0],
        storeLatitude: storeLocation.coordinates[1],
      });

      await newOrder.save();
      clearCart(userId);

      return res.json({
        message: 'Order placed successfully',
        orderId: newOrder._id,
      });
    }

    // Create the Razorpay order
    const razorpayOrder = await createRazorpayOrder(newOrder);

    if (!razorpayOrder) {
      return res
        .status(500)
        .json({ message: 'Failed to create payment order' });
    }

    newOrder.paymentId = razorpayOrder.id;
    await newOrder.save();

    res.status(201).json({
      message: 'Order created successfully',
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: env.RAZORPAY_KEY_ID,
      orderId: newOrder._id,
      outOfStockProducts,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const getUserCart = async (userId: string) => {
  try {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: 'products.productId',
        select: ['variants', 'storeId', 'name'],
        populate: {
          path: 'storeId',
          model: 'Shop',
          select: ['name', 'location'],
        },
      })
      .lean()
      .exec();

    if (!cart) {
      return null;
    }

    return cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

async function enrichWithPrice(userId: string): Promise<EnrichWithPriceReturn> {
  const cart = (await getUserCart(userId)) as unknown as CartWithTotal;
  let totalPrice = 0;
  const outOfStockProducts: string[] = [];

  if (cart) {
    cart.products.forEach((product, index) => {
      const variant = (product.productId as unknown as Product).variants.find(
        (variant) => variant._id.toString() === product.variantId.toString()
      );

      if (!variant) {
        throw new Error('Variant not found');
      }

      if (variant.stock < product.quantity) {
        outOfStockProducts.push((product.productId as unknown as Product).name);
        cart.products.splice(index, 1);
        return;
      }

      product.storeLocation = (
        product.productId as unknown as Product
      ).storeId.location;
      product.storeId = (product.productId as unknown as Product).storeId._id;
      product.storeName = (
        product.productId as unknown as Product
      ).storeId.name;

      product.name = (product.productId as unknown as Product).name;

      // Set price for the cart item
      product.price = variant.discountedPrice || variant.price;

      // Replace populated productId with its actual ObjectId
      product.productId = (product.productId as unknown as Product)._id;

      // Calculate total price for the order
      totalPrice +=
        (variant.discountedPrice || variant.price) * product.quantity;
    });

    cart.totalAmount = Math.round(totalPrice);

    return { cart, outOfStockProducts };
  }

  return { cart: null, outOfStockProducts: [] };
}

export async function createRazorpayOrder(order: IOrder) {
  try {
    const instance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_SECRET,
    });

    const options = {
      amount: order.totalAmount * 100, // convert to paise
      currency: 'INR',
      receipt: `receipt_order_${order._id}`,
    };

    const razorpayOrder = await instance.orders.create(options);

    if (!razorpayOrder) throw new Error('Failed to create Razorpay order');

    return razorpayOrder;
  } catch (error) {
    console.error('Failed to create Razorpay order:', error);
    throw error;
  }
}
