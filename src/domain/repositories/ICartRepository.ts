import { ObjectId } from 'mongoose';
import { ICart } from '../../infrastructure/database/models/CartSchema';

export interface ICartRepository {
  findCartByUserId(userId: string | ObjectId): Promise<ICart | null>;
}
