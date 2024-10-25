import { Request, Response } from 'express';
import { AddToWishlist } from '../../application/usecases/AddToWishlist';
import { GetWishlist } from '../../application/usecases/GetWishlist';
import { getRequestUserId } from '../../infrastructure/utils/authUtils';
import { RemoveFromWishlist } from '../../application/usecases/RemoveFromWishlist';

export class WishlistController {
  constructor(
    private addToWishlist: AddToWishlist,
    private getWishlistUsecase: GetWishlist,
    private removeFromWishlistUsecase: RemoveFromWishlist
  ) {}

  async addItem(req: Request, res: Response): Promise<Response> {
    const { productId, productName } = req.body;
    const userId = getRequestUserId(req);

    try {
      const wishlist = await this.addToWishlist.execute(userId, {
        productId,
        productName,
      });
      return res.status(201).json(wishlist);
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  }

  async getWishlist(req: Request, res: Response): Promise<Response> {
    const userId = getRequestUserId(req);

    try {
      const wishlist = await this.getWishlistUsecase.execute(userId);
      return wishlist
        ? res.status(200).json(wishlist)
        : res.status(404).json({ message: 'Wishlist not found' });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  }

  async removeFromWishlist(req: Request, res: Response): Promise<Response> {
    const { productId } = req.params;
    const userId = getRequestUserId(req);

    try {
      const wishlist = await this.removeFromWishlistUsecase.execute(
        userId,
        productId
      );
      return wishlist
        ? res.status(200).json(wishlist)
        : res.status(404).json({ message: 'Wishlist not found' });
    } catch (error) {
      return res.status(500).json({ message: (error as Error).message });
    }
  }
}
