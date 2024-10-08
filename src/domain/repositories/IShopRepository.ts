import { ObjectId } from 'mongoose';
import { IShop } from '../../infrastructure/database/models/ShopSchema';

export interface IShopRepository {
  findStoresNearLocation(
    storeIds: ObjectId[],
    location: { latitude: number; longitude: number },
    maxDistance: number
  ): Promise<IShop[]>;
}
