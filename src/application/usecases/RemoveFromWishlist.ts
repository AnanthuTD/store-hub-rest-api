import { ObjectId } from 'mongoose';
import { IWishlist } from '../../domain/entities/IWishlist';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';

export class RemoveFromWishlist {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(
    userId: ObjectId | string,
    productId: string
  ): Promise<IWishlist> {
    return await this.wishlistRepository.removeItem(userId, productId);
  }
}
