import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import Order, {
  IOrder,
} from '../../../../infrastructure/database/models/OrderSchema';
import mongoose from 'mongoose';
import { io } from '../../../..';

interface Variant {
  _id: mongoose.Schema.Types.ObjectId;
  price: number;
  discountedPrice: number;
}

interface Product {
  _id: mongoose.Schema.Types.ObjectId;
  variants: Variant[];
  storeId: mongoose.Schema.Types.ObjectId;
}

interface CartWithTotal {
  products: IOrder['items'];
  totalAmount: number;
  storeId: mongoose.Schema.Types.ObjectId;
}

export default async function createOrder(req: Request, res: Response) {
  try {
    const userId: string = req.user._id;

    const cart = await enrichWithPrice(userId);

    // TODO: need to check if the products are still available or in stock

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
        price: product.price,
        storeId: product.storeId,
      })),
      totalAmount: cart.totalAmount,
      paymentStatus: 'Pending',
      paymentId: null,
      paymentMethod: 'Razorpay',
    });

    // Clear the user's cart after successful order creation
    clearCart(userId);

    res.status(201).json({ message: 'Order created successfully' });

    // Notify the vendor about the new order
    notifyVendor(cart, newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const getUserCart = async (userId: string) => {
  try {
    const cart = await Cart.findOne({ userId })
      .populate('products.productId', ['variants', 'storeId'])
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

async function enrichWithPrice(userId: string): Promise<CartWithTotal | null> {
  const cart = (await getUserCart(userId)) as unknown as CartWithTotal;
  let totalPrice = 0;

  if (cart) {
    cart.products.forEach((product) => {
      const variant = (product.productId as unknown as Product).variants.find(
        (variant) => variant._id.toString() === product.variantId.toString()
      );

      if (!variant) {
        throw new Error('Variant not found');
      }

      product.storeId = (product.productId as unknown as Product).storeId;

      // Set price for the cart item
      product.price = variant.discountedPrice || variant.price;

      // Replace populated productId with its actual ObjectId
      product.productId = (product.productId as unknown as Product)._id;

      // Calculate total price for the order
      totalPrice += variant.price * product.quantity;
    });

    cart.totalAmount = Number(totalPrice.toFixed(2));

    return cart;
  }

  return null;
}

function clearCart(userId: string) {
  Cart.deleteOne({ userId });
}

function notifyVendor(cart, order: IOrder) {
  // Create a map to group products by storeId
  const storeMap = new Map();

  cart.products.forEach((product) => {
    const storeId = product.storeId.toString();

    // If the storeId is already in the map, add the product to the array
    if (storeMap.has(storeId)) {
      storeMap.get(storeId).push(product);
    } else {
      // Otherwise, create a new entry with the storeId and initialize with the product
      storeMap.set(storeId, [product]);
    }
  });

  // Notify each vendor with the grouped products
  storeMap.forEach((products, storeId) => {
    io.to(`store_${storeId}`).emit('newOrder', {
      _id: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items: products,
      totalAmount: products.reduce(
        (acc, item) =>
          acc + (item.discountedPrice || item.price) * item.quantity,
        0
      ),
      orderDate: order.orderDate,
      shippingAddress: order.shippingAddress,
    });
  });
}
