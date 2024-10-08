import { ObjectId } from 'mongoose';
import { ICartRepository } from '../../domain/repositories/ICartRepository';
import Cart, { ICart } from '../database/models/CartSchema';

export class CartRepository implements ICartRepository {
  async findCartByUserId(userId: string | ObjectId): Promise<ICart | null> {
    return Cart.findOne({ userId: userId });
  }
}
