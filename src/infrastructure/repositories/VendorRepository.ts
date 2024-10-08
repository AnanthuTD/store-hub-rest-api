import { injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import Vendor from '../database/models/ShopOwnerModel';
import { IShopOwner } from '../../domain/entities/IShopOwner';
import { ProjectionType } from 'mongoose';

@injectable()
export class VendorOwnerRepository implements IShopOwnerRepository {
  async findByEmail(email: string) {
    return Vendor.findOne({ email }).exec();
  }

  async createWithCredential(email: string, passwordHash: string) {
    const newShopOwner = new Vendor({
      email,
      authMethods: [{ passwordHash, provider: 'credential' }],
    });
    return newShopOwner.save();
  }

  public async findById(id: string): Promise<IShopOwner | null> {
    return await Vendor.findById(id).lean().exec();
  }

  public async update(
    id: string,
    shopOwner: Partial<IShopOwner>
  ): Promise<void> {
    await Vendor.findByIdAndUpdate(id, shopOwner, {
      new: true,
      upsert: false,
    }).exec();
  }

  async getUserByMobile(mobileNumber: string): Promise<IShopOwner | null> {
    return Vendor.findOne({ mobileNumber });
  }

  async setVerified(email: string): Promise<IShopOwner | null> {
    const shopOwner = await Vendor.findOneAndUpdate(
      { email },
      { emailVerified: true }
    ).exec();
    return shopOwner;
  }

  async getByEmail(email: string): Promise<IShopOwner | null> {
    return Vendor.findOne({ email }).exec();
  }

  async create(user: IShopOwner): Promise<IShopOwner> {
    return Vendor.create(user);
  }

  async getNotVerified() {
    const vendors = await Vendor.find({ isVerified: false }, { profile: 1 });
    return vendors.filter(
      (vendor) => Object.keys(vendor?.documents ?? {}).length > 0
    );
  }

  async getVerified() {
    const vendors = await Vendor.find({ isVerified: true }, { profile: 1 });
    return vendors;
  }

  async getById(id: string, projection?: ProjectionType<IShopOwner>) {
    return Vendor.findById(id, projection);
  }

  async updateDocumentStatus(
    vendorData: Partial<IShopOwner>
  ): Promise<IShopOwner> {
    const { _id, ...updateData } = vendorData;

    const upsertedVendor = await Vendor.findOneAndUpdate(
      { _id }, // Match by _id
      { $set: updateData }, // Set the fields that need to be updated
      { new: true, upsert: true, useFindAndModify: false } // Options: return the new document, create if not exists
    )
      .lean()
      .exec();

    return upsertedVendor as IShopOwner;
  }
}
