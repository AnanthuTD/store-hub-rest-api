import { injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import ShopOwner from '../database/models/ShopOwnerModel';

@injectable()
export class ShopOwnerRepository implements IShopOwnerRepository {
  async findByEmail(email: string) {
    return ShopOwner.findOne({ email }).exec();
  }

  async createWithCredential(email: string, passwordHash: string) {
    const newShopOwner = new ShopOwner({
      email,
      authMethods: [{ passwordHash, provider: 'credential' }],
    });
    return newShopOwner.save();
  }
}
