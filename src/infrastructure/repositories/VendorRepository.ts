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
import { ISubscriptionPlan } from '../database/models/SubscriptionPlanModel';
import eventEmitter from '../../eventEmitter/eventEmitter';
import { RazorpayService } from '../services/razorpayService';

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
    razorpayResponse: any,
    subscriptionPlan: ISubscriptionPlan
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
      current_end,
      current_start,
      charge_at,
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
      amount: subscriptionPlan.price,
      shortUrl,
      notes,
      currentEnd: current_end ? new Date(current_end * 1000) : null,
      currentStart: current_start ? new Date(current_start * 1000) : null,
      chargeAt: new Date(charge_at * 1000),
    });

    console.log('new sub: ', newSubscription);

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
      const result = await VendorSubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        { $set: updatedFields },
        { new: true }
      );

      /*   if (result.modifiedCount === 0) {
        throw new Error(
          'No subscription was updated. Please check the subscription ID.'
        );
      } */

      eventEmitter.emit(
        'subscription:status:update',
        result?.vendorId.toString()
      );

      return result;
    } catch (error) {
      console.error('Error updating vendor subscription:', error);
      throw error;
    }
  };

  cancelVendorSubscription = async (vendorId: string) => {
    try {
      // Fetch the subscription from your database
      const subscription = await VendorSubscriptionModel.findOne({
        vendorId,
        status: { $in: ['authenticated', 'active'] },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if the subscription is in an active or authorized state
      if (
        subscription.status !== 'active' &&
        subscription.status !== 'authenticated'
      ) {
        return {
          message: `Cannot cancel subscription. Current status is '${subscription.status}'. Subscription can only be cancelled if it's in 'active' or 'authenticated' state.`,
          subscriptionStatus: subscription.status,
        };
      }

      // Make API call to Razorpay to cancel the subscription
      const razorpayResponse = await new RazorpayService().cancelSubscription(
        subscription.razorpaySubscriptionId
      );

      console.log(razorpayResponse);

      const { status: razorpayStatus, id: razorpaySubscriptionId } =
        razorpayResponse;

      const updatedSubscription =
        await VendorSubscriptionModel.findOneAndUpdate(
          {
            vendorId,
            razorpaySubscriptionId: subscription.razorpaySubscriptionId,
          },
          {
            status: razorpayResponse.status,
            endedAt: razorpayResponse.ended_at
              ? new Date(razorpayResponse.ended_at * 1000)
              : null,
          },
          { new: true }
        );

      eventEmitter.emit('subscription:status:update', vendorId.toString());

      return {
        message: 'Subscription cancelled successfully',
        razorpaySubscriptionId,
        status: razorpayStatus,
        subscription: updatedSubscription,
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  };
}
