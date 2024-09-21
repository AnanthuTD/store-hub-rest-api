import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import { findProductInCart } from './helper';
import logger from '../../../../infrastructure/utils/logger';

export const removeProductFromCart = async (req: Request, res: Response) => {
  const { productId, variantId } = req.query;
  const userId = req.user._id as string;

  if (!productId || !variantId) {
    return res
      .status(400)
      .json({ error: 'Product ID and variant ID are required.' });
  }

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    const productIndex = findProductInCart(
      cart,
      productId as string,
      variantId as string
    );

    if (productIndex > -1) {
      cart.products.splice(productIndex, 1); // Remove product from cart
      await cart.save();

      return res.status(200).json({
        message: 'Product removed from cart.',
        cart,
      });
    } else {
      return res.status(404).json({ error: 'Product not found in cart.' });
    }
  } catch (error) {
    logger.error('Error removing product from cart:', error);
    return res
      .status(500)
      .json({ message: 'Failed to remove product from cart.' });
  }
};
