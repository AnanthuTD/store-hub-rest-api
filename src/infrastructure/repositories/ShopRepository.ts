import { ObjectId } from 'mongoose';
import { IShopRepository } from '../../domain/repositories/IShopRepository';
import Shop, { IShop } from '../database/models/ShopSchema';

export class ShopRepository implements IShopRepository {
  async findStoresNearLocation(
    storeIds: ObjectId[],
    location: { latitude: number; longitude: number },
    maxDistance: number
  ): Promise<IShop[]> {
    console.log(location, storeIds);

    return Shop.aggregate([
      {
        $match: {
          _id: { $in: storeIds },
          location: {
            $geoWithin: {
              $centerSphere: [
                [location.longitude, location.latitude],
                maxDistance / 6378100,
              ], // Convert meters to radians
            },
          },
        },
      },
    ]);
  }
}
