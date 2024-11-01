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
  IVendorSubscription,
  SubscriptionStatus,
} from '../database/models/VendorSubscriptionModal';
import { Subscriptions } from 'razorpay/dist/types/subscriptions';
import {
  ISubscriptionPlan,
  SubscriptionPlan,
} from '../database/models/SubscriptionPlanModel';
import eventEmitter from '../../eventEmitter/eventEmitter';
import { RazorpayService } from '../services/razorpayService';
import ShopOwner from '../database/models/ShopOwnerModel';

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
    const vendors = await Vendor.find(
      { isVerified: false },
      { profile: 1, documents: 1 }
    );
    console.log(vendors);
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

  SubscriptionStatusOrder = {
    [SubscriptionStatus.CREATED]: [
      SubscriptionStatus.AUTHENTICATED,
      SubscriptionStatus.PENDING,
    ],
    [SubscriptionStatus.AUTHENTICATED]: [SubscriptionStatus.ACTIVE],
    [SubscriptionStatus.ACTIVE]: [
      SubscriptionStatus.HALTED,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.PAUSED,
    ],
    [SubscriptionStatus.PAUSED]: [SubscriptionStatus.RESUMED],
    [SubscriptionStatus.RESUMED]: [SubscriptionStatus.ACTIVE],
    [SubscriptionStatus.HALTED]: [SubscriptionStatus.CANCELLED],
    [SubscriptionStatus.CANCELLED]: [SubscriptionStatus.COMPLETED],
    [SubscriptionStatus.COMPLETED]: [],
    [SubscriptionStatus.EXPIRED]: [],
    [SubscriptionStatus.CHARGED]: [SubscriptionStatus.ACTIVE],
  };

  updateVendorSubscription = async (
    subscriptionId: string,
    updatedFields: { status: SubscriptionStatus }
  ) => {
    try {
      const currentSubscription = await VendorSubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionId,
      });

      if (!currentSubscription) {
        throw new Error('Subscription not found.');
      }

      const currentStatus = currentSubscription.status;
      const newStatus = updatedFields.status;

      // Log received status
      console.log(
        `Received webhook with intent to update status to: ${newStatus}`
      );

      // Check for redundant updates
      if (currentStatus === newStatus) {
        console.log(
          `Skipping update: Subscription ${subscriptionId} is already in status ${newStatus}.`
        );
        return currentSubscription;
      }

      if (currentStatus === SubscriptionStatus.ACTIVE) {
        // Validate transition
        const allowedNextStatuses = this.SubscriptionStatusOrder[currentStatus];
        if (!allowedNextStatuses.includes(newStatus)) {
          console.log(
            `Skipping update: Transition from ${currentStatus} to ${newStatus} is not allowed.`
          );
          return currentSubscription;
        }
      }

      // Perform the update ( if change findOneAndUpdate change the hook as well )
      const result = await VendorSubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        { $set: updatedFields, lastUpdated: new Date() },
        { new: true }
      );

      console.log(
        `Subscription ${subscriptionId} status updated to ${newStatus}`
      );

      if (result) this.addActiveSubscriptionId(result);

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

  addActiveSubscriptionId = async (subscription: IVendorSubscription) => {
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      const planData = await SubscriptionPlan.findOne({
        planId: subscription.planId,
      });
      const totalProductsAllowed = planData?.productLimit || 10; // Default to 10 if not specified

      console.log(
        'VendorId: ',
        subscription.vendorId,
        '\tActive subscription: ',
        subscription._id
      );

      // Update the totalProductsAllowed in ShopOwner
      const result = await ShopOwner.findOneAndUpdate(
        { _id: subscription.vendorId },
        {
          totalProductsAllowed: totalProductsAllowed,
          activeSubscriptionId: subscription._id,
        },
        { new: true }
      );

      console.log(result);
    } else {
      // If the status is any other value, set totalProductsAllowed to 10
      const result = await ShopOwner.findOneAndUpdate(
        { _id: subscription.vendorId },
        { totalProductsAllowed: 10, activeSubscriptionId: null },
        { new: true }
      );

      console.log(result);
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

      if (subscription.cancelledAt) {
        return {
          message: `Subscription ${subscription._id} has already been cancelled ( CancelledAt: ${subscription.cancelledAt.toString()}() })`,
          subscriptionStatus: subscription.status,
        };
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
            cancelledAt: new Date(),
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
