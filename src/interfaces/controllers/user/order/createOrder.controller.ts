import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import Order, {
  IOrder,
} from '../../../../infrastructure/database/models/OrderSchema';
import mongoose from 'mongoose';

interface Variant {
  _id: mongoose.Schema.Types.ObjectId;
  price: number;
}

interface Product {
  _id: mongoose.Schema.Types.ObjectId;
  variants: Variant[];
}

interface CartWithTotal {
  products: IOrder['items'];
  totalAmount: number;
}

export default async function createOrder(req: Request, res: Response) {
  try {
    const userId: string = req.user._id;

    const cart = await enrichWithPrice(userId);

    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ message: 'Add products to cart to buy' });
    }

    // Create the order using the enriched cart data
    await Order.create({
      userId,
      items: cart.products.map((product) => ({
        productId: product.productId,
        variantId: product.variantId,
        quantity: product.quantity,
        price: product.price,
      })),
      totalAmount: cart.totalAmount,
      paymentStatus: 'Pending',
      paymentId: null,
      paymentMethod: 'Razorpay',
    });

    // Clear the user's cart after successful order creation
    clearCart(userId);

    return res.status(201).json({ message: 'Order created successfully' });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const getUserCart = async (userId: string) => {
  try {
    const cart = await Cart.findOne({ userId })
      .populate('products.productId', 'variants')
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

      // Set price for the cart item
      product.price = variant.price;

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
