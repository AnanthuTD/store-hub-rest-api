import { injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import Vendor from '../database/models/ShopOwnerModel';
import { IShopOwner } from '../../domain/entities/IShopOwner';
import { ObjectId, ProjectionType } from 'mongoose';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../database/models/TransactionSchema';
import TransactionRepository from './TransactionRepository';
import VendorSubscriptionModel, {
  SubscriptionStatus,
  SubscriptionType,
} from '../database/models/VendorSubscriptionModal';
import { Subscriptions } from 'razorpay/dist/types/subscriptions';

@injectable()
export class VendorOwnerRepository implements IShopOwnerRepository {
  transactionRepository: TransactionRepository = new TransactionRepository();

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

  async getWalletBalance(vendorId: string | ObjectId): Promise<number> {
    const user = await Vendor.findById(vendorId).lean();

    if (!user) throw new Error('User not found');
    return user.walletBalance;
  }

  async debitMoneyFromWallet(
    amount: number,
    userId: string | ObjectId
  ): Promise<IShopOwner | null> {
    const vendor = await Vendor.findById(userId).lean();

    if (!vendor) throw new Error('User not found');
    if (vendor.walletBalance < amount)
      throw new Error('Insufficient funds in wallet');

    const updatedUser = await Vendor.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: -amount } },
      { new: true }
    ).lean();

    if (!updatedUser) throw new Error('Error updating user balance');

    const transactionData: ITransaction = {
      userId,
      amount,
      type: TransactionType.DEBIT,
      status: TransactionStatus.SUCCESS,
      date: new Date(),
    };

    await this.transactionRepository.createTransaction(transactionData);

    return updatedUser;
  }

  async creditMoneyToWallet(
    amount: number,
    userId: string | ObjectId
  ): Promise<IShopOwner | null> {
    const user = await Vendor.findById(userId).lean();

    if (!user) throw new Error('User not found');

    const updatedUser = await Vendor.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).lean();

    if (!updatedUser) throw new Error('Error updating user balance');

    const transactionData: ITransaction = {
      userId,
      amount,
      type: TransactionType.CREDIT,
      status: TransactionStatus.SUCCESS,
      date: new Date(),
    };

    await this.transactionRepository.createTransaction(transactionData);

    return updatedUser;
  }

  createVendorSubscription = async (
    vendorId: string,
    razorpayResponse: any
  ) => {
    const {
      id: razorpaySubscriptionId,
      plan_id: planId,
      status,
      start_at: startDate,
      end_at: endDate,
      remaining_count: remainingCount,
      paid_count: paidCount,
      total_count: totalCount,
      short_url: shortUrl,
      notes,
    }: Subscriptions.RazorpaySubscription = razorpayResponse;

    // Create the new subscription document
    const newSubscription = new VendorSubscriptionModel({
      vendorId,
      razorpaySubscriptionId,
      planId,
      subscriptionType: SubscriptionType.PREMIUM,
      startDate: new Date(startDate * 1000),
      endDate: new Date(endDate * 1000),
      status,
      remainingCount,
      paidCount,
      totalCount,
      amount: 5000,
      shortUrl,
      notes,
    });

    await newSubscription.save();
    return newSubscription;
  };

  getVendorSubscription = (vendorId: string | ObjectId) => {
    return VendorSubscriptionModel.find({ vendorId });
  };

  updateSubscriptionStatusToActive = (vendorId: string | ObjectId) => {
    return VendorSubscriptionModel.findOneAndUpdate(
      { vendorId },
      { $set: { status: SubscriptionStatus.ACTIVE } },
      { new: true }
    ).exec();
  };

  updateVendorSubscription = async (subscriptionId, updatedFields) => {
    try {
      const result = await VendorSubscriptionModel.updateOne(
        { razorpaySubscriptionId: subscriptionId },
        { $set: updatedFields }
      );

      if (result.modifiedCount === 0) {
        throw new Error(
          'No subscription was updated. Please check the subscription ID.'
        );
      }

      return result;
    } catch (error) {
      console.error('Error updating vendor subscription:', error);
      throw error;
    }
  };
}
