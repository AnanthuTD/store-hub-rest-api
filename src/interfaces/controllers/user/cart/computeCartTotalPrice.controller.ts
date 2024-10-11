import { Request, Response } from 'express';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import logger from '../../../../infrastructure/utils/logger';
import UserRepository from '../../../../infrastructure/repositories/UserRepository';
import { discountUseCase } from '../../../../application/usecases/discountUsecase';

// Controller to calculate the total price of all items in the user's cart
export const calculateTotalPrice = async (req: Request, res: Response) => {
  const userId = req.user?._id as string; // assuming userId is available in the req object
  const { useWallet, couponCode } = req.query;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.products.length === 0) {
      return res.status(200).json({
        message: 'Cart is empty or not found.',
        totalPrice: 0,
        itemCount: 0,
      });
    }

    let totalPrice = 0;
    let itemsEligibleToBuy = 0;

    // Loop through each product in the cart
    for (const cartProduct of cart.products) {
      // Fetch the product and its variant to get the price
      const product = await StoreProducts.findOne({
        _id: cartProduct.productId,
        'variants._id': cartProduct.variantId,
      }).select('variants');

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      const variant = product.variants.find(
        (variant) => variant._id.toString() === cartProduct.variantId.toString()
      );

      if (!variant) {
        return res.status(404).json({ message: 'Variant not found.' });
      }

      if (variant.stock >= cartProduct.quantity) {
        // Calculate total price by multiplying quantity with variant price
        const itemTotal =
          (variant.discountedPrice || variant.price) * cartProduct.quantity;
        totalPrice += Math.round(itemTotal);
        itemsEligibleToBuy += 1;
      }
    }

    // Subtract the wallet balance if the user is using a wallet
    if (useWallet === 'true') {
      const walletBalance = await new UserRepository().getWalletBalance(userId);
      console.log(useWallet, totalPrice, walletBalance);
      totalPrice = Math.max(0, totalPrice - walletBalance);
    }

    const afterDiscount = await discountUseCase.calculate(
      userId,
      couponCode,
      totalPrice
    );

    return res.status(200).json({
      totalPrice: afterDiscount.finalAmount,
      discount: afterDiscount.discount,
      itemCount: itemsEligibleToBuy,
    });
  } catch (error) {
    logger.error('Error calculating total price:', { error, userId });
    return res
      .status(500)
      .json({ message: 'Failed to calculate total price.' });
  }
};
