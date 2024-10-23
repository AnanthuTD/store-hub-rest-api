import { ObjectId } from 'mongoose';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import Cart, { ICart } from '../database/models/CartSchema';

export class CartRepository implements ICartRepository {
  async findCartByUserId(userId: string | ObjectId): Promise<ICart | null> {
    return Cart.findOne({ userId: userId });
  }

  async getTotalQuantity(userId: ObjectId): Promise<number> {
    const cart: ICart | null = await Cart.findOne({ userId });

    if (!cart) {
      return 0;
    }

    const totalQuantity = cart.products.reduce(
      (acc, product) => acc + product.quantity,
      0
    );
    return totalQuantity;
  }
}
