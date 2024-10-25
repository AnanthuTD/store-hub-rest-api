import { ObjectId } from 'mongoose';
import { IWishlist } from '../entities/IWishlist';

export interface IWishlistRepository {
  getByUserId(userId: ObjectId | string): Promise<IWishlist | null>;
  addItem(
    userId: ObjectId | string,
    product: { productId: string; productName: string }
  ): Promise<IWishlist>;
  removeItem(userId: ObjectId | string, productId: string): Promise<IWishlist>;
}
