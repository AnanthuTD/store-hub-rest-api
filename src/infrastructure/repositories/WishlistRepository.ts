import mongoose from 'mongoose';
import { IWishlist } from '../../domain/entities/IWishlist';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import {
  WishlistDocument,
  WishlistModel,
} from '../database/models/WishlistModel';

export class WishlistRepository implements IWishlistRepository {
  async getByUserId(userId: string): Promise<IWishlist | null> {
    const wishlistDoc = await WishlistModel.findOne({ userId });
    return wishlistDoc ? this.toDomain(wishlistDoc) : null;
  }

  async addItem(
    userId: string,
    product: { productId: string; productName: string }
  ): Promise<IWishlist> {
    let wishlistDoc = await WishlistModel.findOne({ userId });

    if (!wishlistDoc) {
      wishlistDoc = new WishlistModel({
        userId,
        items: [{ ...product, addedAt: new Date() }],
      });
    } else {
      wishlistDoc.items.push({
        ...product,
        productId: new mongoose.Schema.Types.ObjectId(product.productId),
        addedAt: new Date(),
      });
    }

    await wishlistDoc.save();
    return this.toDomain(wishlistDoc);
  }

  async removeItem(userId: string, productId: string): Promise<IWishlist> {
    const wishlistDoc = await WishlistModel.findOne({ userId });
    if (!wishlistDoc) throw new Error('Wishlist not found');

    wishlistDoc.items = wishlistDoc.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await wishlistDoc.save();
    return this.toDomain(wishlistDoc);
  }

  private toDomain(wishlistDoc: WishlistDocument): IWishlist {
    return {
      id: (wishlistDoc._id as mongoose.Schema.Types.ObjectId).toString(),
      userId: wishlistDoc.userId.toString(),
      items: wishlistDoc.items.map((item) => ({
        productId: item.productId.toString(),
        productName: item.productName,
        addedAt: item.addedAt,
      })),
    };
  }
}
