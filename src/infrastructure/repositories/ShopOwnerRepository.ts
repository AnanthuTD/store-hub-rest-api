import { injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import ShopOwner from '../database/models/ShopOwnerModel';
import { IShopOwner } from '../../domain/entities/IShopOwner';
import { ProjectionType } from 'mongoose';

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

  public async findById(id: string): Promise<IShopOwner | null> {
    return await ShopOwner.findById(id).lean().exec();
  }

  public async update(
    id: string,
    shopOwner: Partial<IShopOwner>
  ): Promise<void> {
    await ShopOwner.findByIdAndUpdate(id, shopOwner, {
      new: true,
      upsert: false,
    }).exec();
  }

  async getUserByMobile(mobileNumber: string): Promise<IShopOwner | null> {
    return ShopOwner.findOne({ mobileNumber });
  }

  async setVerified(email: string): Promise<IShopOwner | null> {
    const shopOwner = await ShopOwner.findOneAndUpdate(
      { email },
      { emailVerified: true }
    ).exec();
    return shopOwner;
  }

  async getByEmail(email: string): Promise<IShopOwner | null> {
    return ShopOwner.findOne({ email }).exec();
  }

  async create(user: IShopOwner): Promise<IShopOwner> {
    return ShopOwner.create(user);
  }

  async getNotVerified() {
    return ShopOwner.find({ isVerified: false }, { profile: 1 });
  }

  async getById(id: string, projection?: ProjectionType<IShopOwner>) {
    return ShopOwner.findById(id, projection);
  }

  async updateDocumentStatus(
    vendorData: Partial<IShopOwner>
  ): Promise<IShopOwner> {
    const { _id, ...updateData } = vendorData;

    const upsertedVendor = await ShopOwner.findOneAndUpdate(
      { _id }, // Match by _id
      { $set: updateData }, // Set the fields that need to be updated
      { new: true, upsert: true, useFindAndModify: false } // Options: return the new document, create if not exists
    )
      .lean()
      .exec();

    return upsertedVendor as IShopOwner;
  }
}
