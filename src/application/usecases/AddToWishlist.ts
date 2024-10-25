import { ObjectId } from 'mongoose';
import { IWishlist } from '../../domain/entities/IWishlist';
import { IWishlistRepository } from '../../domain/repositories/IWishlistRepository';

export class AddToWishlist {
  constructor(private wishlistRepository: IWishlistRepository) {}

  async execute(
    userId: ObjectId | string,
    product: { productId: string; productName: string }
  ): Promise<IWishlist> {
    return await this.wishlistRepository.addItem(userId, product);
  }
}
