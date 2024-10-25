import { ObjectId } from 'mongoose';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';

export class CheckItemInWishlist {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(
    userId: ObjectId | string,
    productId: string
  ): Promise<boolean> {
    return await this.wishlistRepository.checkItemInWishlist(userId, productId);
  }
}
