import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import logger from '../../../../infrastructure/utils/logger';

export const getCartItems = async (req: Request, res: Response) => {
  const userId = req.user?._id; // Ensure userId is valid
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  try {
    // Fetch the user's cart
    const cart = await Cart.aggregate([
      {
        $match: { userId },
      },
      {
        $lookup: {
          from: 'storeproducts',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true, // Keep items even if no matching product found
        },
      },
    ]);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: 'No items in the cart' });
    }

    const cartItems = cart[0].products; // User's product list in the cart

    // Map through the cart and enrich products with details & selected variant
    const enrichedCart = cart
      .map(({ productDetails }) => {
        const { _id: productId, variants } = productDetails;

        // Find the cart product that matches the productId from the cart
        const cartProduct = cartItems.find(
          (item) => item.productId.toString() === productId.toString()
        );

        if (cartProduct) {
          // Find the matching variant based on variantId from the cart
          const selectedVariant = variants.find(
            (variant) =>
              variant._id.toString() === cartProduct.variantId.toString()
          );

          return {
            productId: cartProduct.productId,
            quantity: cartProduct.quantity,
            ...productDetails,
            variant: selectedVariant,
          };
        }

        return null; // Return null if no matching cart product is found
      })
      .filter(Boolean); // Filter out any null values

    res.json({ cartItems: enrichedCart });
  } catch (error) {
    logger.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
