import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import logger from '../../../../infrastructure/utils/logger';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import mongoose from 'mongoose';

interface AddToCartBody {
  productId: string;
  variantId: string;
}

export const findProductVariant = async (
  productId: string,
  variantId: string
) => {
  const product = await StoreProducts.findOne(
    { _id: productId, 'variants._id': variantId },
    { 'variants.$': 1, storeId: 1 } // Only select the matching variant
  );
  return {
    variant: product?.variants.find((v) => v._id.toString() === variantId),
    storeId: product?.storeId,
  };
};

const findOrCreateCart = async (userId: string) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, products: [] });
    await cart.save();
  }
  return cart;
};

const handleError = (res: Response, message: string, statusCode = 400) => {
  return res.status(statusCode).json({ message });
};

export const addToCart = async (req: Request, res: Response) => {
  const { productId, variantId }: AddToCartBody = req.body;
  const userId = req.user?._id as string;

  // Input validation
  if (!productId || !variantId) {
    return handleError(res, 'Invalid input data.');
  }

  try {
    // Check if product and variant exist
    const { variant, storeId } = await findProductVariant(productId, variantId);

    if (!storeId) {
      return handleError(res, 'Store not found for the provided product.', 404);
    }

    if (!variant) {
      return handleError(res, 'Product or variant not found.', 404);
    }

    let totalPrice = variant.discountedPrice;

    if (variant.stock <= 0) {
      return handleError(res, 'Product out of stock.', 400);
    }

    // Find or create the cart for the user
    const cart = await findOrCreateCart(userId);

    if (cart.products.length > 0) {
      if (cart.products[0].storeId.toString() !== storeId.toString()) {
        return handleError(
          res,
          'Cannot add products from different stores to the same cart.',
          400
        );
      }
    }

    // Check if product variant already exists in the cart
    const productIndex = cart.products.findIndex(
      (p) =>
        p.productId.toString() === productId &&
        p.variantId.toString() === variantId
    );

    if (productIndex > -1) {
      // Update quantity if product exists in cart
      const newQuantity = cart.products[productIndex].quantity + 1;
      totalPrice *= newQuantity;
      if (newQuantity > variant.stock) {
        return handleError(res, 'Product out of stock.', 400);
      }
      cart.products[productIndex].quantity = newQuantity;
    } else {
      // Add new product variant to the cart
      cart.products.push({
        productId: new mongoose.Types.ObjectId(productId),
        variantId: new mongoose.Types.ObjectId(variantId),
        quantity: 1,
        storeId: storeId,
      });
    }

    await cart.save();
    return res.status(200).json({
      message: 'Product added/updated in cart.',
      totalPrice: totalPrice?.toFixed(2),
      inStock: true,
    });
  } catch (error) {
    logger.error('Error adding product to cart:', {
      error,
      userId,
      productId,
      variantId,
    });
    return res.status(500).json({ error: 'Failed to add product to cart.' });
  }
};
