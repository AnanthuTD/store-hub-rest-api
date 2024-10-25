import mongoose from 'mongoose';
import { IWishlist } from '../../domain/entities/IWishlist';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';
import {
  WishlistDocument,
  WishlistModel,
} from '../database/models/WishlistModel';

export class WishlistRepository implements IWishlistRepository {
  async getWishlist(userId: string): Promise<IWishlist['items'] | []> {
    const wishlistDoc = await WishlistModel.findOne({ userId }).populate(
      'items.productId'
    );

    const items = wishlistDoc?.items.map((item) => ({
      productName: item.productId.name,
      productImage: item.productId.images[0],
      productId: item.productId._id,
    }));

    return items || [];
  }

  async addItem(userId: string, productId: string): Promise<IWishlist> {
    console.log(productId);

    let wishlistDoc = await WishlistModel.findOne({ userId });

    if (!wishlistDoc) {
      wishlistDoc = new WishlistModel({
        userId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(productId),
            addedAt: new Date(),
          },
        ],
      });
    } else {
      const isInWishlist = wishlistDoc.items.some(
        (item) => item.productId.toString() !== productId
      );

      if (!isInWishlist) {
        wishlistDoc.items.push({
          productId: new mongoose.Types.ObjectId(productId),
          addedAt: new Date(),
        });
      }
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
    console.log(wishlistDoc.items, productId);

    await wishlistDoc.save();
    return this.toDomain(wishlistDoc);
  }

  async checkItemInWishlist(
    userId: mongoose.ObjectId | string,
    productId: string
  ): Promise<boolean> {
    const wishlistDoc = await WishlistModel.findOne({ userId });
    if (!wishlistDoc) return false;

    return wishlistDoc.items.some(
      (item) => item.productId.toString() === productId
    );
  }

  private toDomain(wishlistDoc: WishlistDocument): IWishlist {
    return wishlistDoc.items.map((item) => ({
      productId: item.productId.toString(),
      addedAt: item.addedAt,
    }));
  }
}
