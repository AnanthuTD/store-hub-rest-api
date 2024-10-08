import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import Order, {
  IOrder,
} from '../../../../infrastructure/database/models/OrderSchema';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import env from '../../../../infrastructure/env/env';
import { checkHomeDeliveryAvailability } from '../../../../application/usecases/CheckHomeDeliveryAvailability';
import { ShopRepository } from '../../../../infrastructure/repositories/ShopRepository';
import { CartRepository } from '../../../../infrastructure/repositories/CartRepository';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';

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
    const { longitude, latitude } = req.body;
    const userId: string = req.user._id;

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

    // Fetch the unavailable products' details
    const unavailableProducts = await StoreProducts.find(
      { _id: { $in: unavailableProductIds } },
      { name: 1, images: 1 }
    ).lean();

    // Fetch the available products' details
    const availableProducts = await StoreProducts.find(
      { _id: { $in: availableProductIds } },
      { name: 1, images: 1 }
    ).lean();

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
      totalAmount: Math.round(cart.totalAmount),
      paymentStatus: 'Pending',
      paymentId: null,
      paymentMethod: 'Razorpay',
      deliveryLocation: {
        coordinates: [longitude, latitude],
      },
    });

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
          select: ['name'],
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
