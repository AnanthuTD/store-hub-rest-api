import { Request, Response } from 'express';
import logger from '../../../../infrastructure/utils/logger';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import { findProductInCart } from './helper';
import { findProductVariant } from './addToCart.controller';

interface DecrementProductInCartBody {
  productId: string;
  variantId: string;
}

export const decrementProductInCart = async (req: Request, res: Response) => {
  const { productId, variantId }: DecrementProductInCartBody = req.body;
  const userId = req.user._id as string;

  if (!productId || !variantId) {
    return res
      .status(400)
      .json({ error: 'Product ID and variant ID are required.' });
  }

  try {
    const variant = await findProductVariant(productId, variantId);

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found.' });
    }

    let totalPrice = variant.discountedPrice;
    let inStock = !!variant.stock;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    const productIndex = findProductInCart(cart, productId, variantId);

    if (productIndex > -1) {
      const currentQuantity = cart.products[productIndex].quantity!;

      if (currentQuantity > 1) {
        cart.products[productIndex].quantity!--; // Decrement the quantity
        totalPrice *= currentQuantity - 1;
        inStock = inStock && currentQuantity - 1 <= variant.stock;
      } else {
        cart.products.splice(productIndex, 1); // Remove product if quantity is 1
      }

      await cart.save();
      return res.status(200).json({
        message:
          currentQuantity > 1
            ? 'Product quantity decremented.'
            : 'Product removed from cart.',
        totalPrice: totalPrice?.toFixed(2),
        inStock,
      });
    } else {
      return res.status(404).json({ error: 'Product not found in cart.' });
    }
  } catch (error) {
    logger.error('Error decrementing product in cart:', error);
    return res
      .status(500)
      .json({ error: 'Failed to update product quantity.' });
  }
};
