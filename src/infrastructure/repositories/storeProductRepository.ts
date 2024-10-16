import { ObjectId } from 'mongoose';
import StoreProducts from '../database/models/StoreProducts';

export class StoreProductRepository {
  async decrementStocks(
    productId: string | ObjectId,
    variantId: string | ObjectId,
    quantity: number
  ): Promise<void> {
    const data = await StoreProducts.findOneAndUpdate(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': -quantity } },
      { new: true }
    );

    if (data) {
      data?.variants.forEach((variant) => {
        if (variant.variantId === variantId) {
          if (variant.stock < 0) {
            variant.stock = 0;
          }
          return;
        }
      });

      data.save();
    }
  }

  updateRating = async (productId: string, newRating: number) => {
    try {
      const product =
        await StoreProducts.findById(productId).select('ratingSummary');

      if (!product || !product.ratingSummary) {
        throw new Error('Product or rating summary not found');
      }

      const { averageRating, totalReview } = product.ratingSummary;

      // Calculate the new average rating
      const updatedTotalReviews = totalReview + 1;
      const updatedAverageRating =
        (averageRating * totalReview + newRating) / updatedTotalReviews;

      const updatedProduct = await StoreProducts.findByIdAndUpdate(
        productId,
        {
          $set: {
            'ratingSummary.averageRating': updatedAverageRating,
            'ratingSummary.totalReview': updatedTotalReviews,
          },
        },
        { new: true }
      );

      return updatedProduct;
    } catch (error) {
      console.error('Error updating rating:', error);
      throw new Error('Unable to update rating');
    }
  };
}
