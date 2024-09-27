import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import logger from '../../../../infrastructure/utils/logger';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';

interface AddToCartBody {
  productId: string;
  variantId: string;
  quantity: number;
}

export const addToCart = async (req: Request, res: Response) => {
  const { productId, variantId, quantity = 1 }: AddToCartBody = req.body;
  const userId = req.user._id as string;

  if (!productId || !variantId || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid input data.' });
  }

  try {
    // Check if the product and variant exist
    const product = await StoreProducts.findOne({
      _id: productId,
      'variants._id': variantId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product or variant not found.' });
    }

    // Find or create the cart for the user
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create a new cart if it doesn't exist
      const newCart = new Cart({
        userId,
        products: [{ productId, variantId, quantity }],
      });

      await newCart.save();
      return res
        .status(201)
        .json({ message: 'Product added to new cart.', cart: newCart });
    } else {
      // Check if the product variant already exists in the cart
      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === productId &&
          p.variantId.toString() === variantId
      );

      if (productIndex > -1) {
        // If product already exists in cart, update the quantity
        cart.products[productIndex].quantity! += quantity;
      } else {
        // Add new product variant to the cart
        cart.products.push({ productId, variantId, quantity });
      }

      await cart.save();
      return res
        .status(200)
        .json({ message: 'Product added/updated in cart.', cart });
    }
  } catch (error) {
    logger.error('Error adding product to cart:', error);
    return res.status(500).json({ error: 'Failed to add product to cart.' });
  }
};
