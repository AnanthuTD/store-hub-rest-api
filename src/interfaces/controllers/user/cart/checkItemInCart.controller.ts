import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import logger from '../../../../infrastructure/utils/logger';

export const checkItemInCart = async (req: Request, res: Response) => {
  const { productId, variantId } = req.query;
  const userId = req.user?._id as string;

  // Ensure all required parameters are present
  if (!productId || !variantId) {
    return res
      .status(400)
      .json({ message: 'Missing required productId or variantId' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  try {
    // Check if the item with specific variant exists in the user's cart
    const cart = await Cart.findOne({
      userId,
      'products.productId': productId,
      'products.variantId': variantId,
    });

    // If cart is found, the product exists in the cart
    const inCart = !!cart;

    res.status(200).json({ inCart });
  } catch (error) {
    logger.error('Error checking item in cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
