import { ObjectId } from 'mongoose';
import { IWishlist } from '../entities/IWishlist';

export interface IWishlistRepository {
  getWishlist(userId: ObjectId | string): Promise<IWishlist[] | null>;
  addItem(userId: ObjectId | string, productId: string): Promise<IWishlist>;
  removeItem(userId: ObjectId | string, productId: string): Promise<IWishlist>;
  checkItemInWishlist(
    userId: ObjectId | string,
    productId: string
  ): Promise<boolean>;
}
