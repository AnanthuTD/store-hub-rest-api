import { ObjectId } from 'mongoose';
import { IWishlist } from '../../domain/entities/IWishlist';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';

export class GetWishlist {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(userId: ObjectId | string): Promise<IWishlist | null> {
    return await this.wishlistRepository.getWishlist(userId);
  }
}
