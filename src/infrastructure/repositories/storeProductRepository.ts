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
      { new: true, lean: true }
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
}
