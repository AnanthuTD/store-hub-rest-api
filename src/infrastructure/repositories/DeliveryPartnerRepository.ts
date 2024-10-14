import { injectable } from 'inversify';
import { IDeliveryPartner } from '../../domain/entities/DeliveryPartner';
import { IDeliveryPartnerRepository } from '../../domain/repositories/IDeliveryPartnerRepository';
import DeliveryPartner from '../database/models/DeliveryPartner';
import { ObjectId } from 'mongoose';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../database/models/TransactionSchema';
import TransactionRepository from './TransactionRepository';

@injectable()
export class DeliveryPartnerRepository implements IDeliveryPartnerRepository {
  transactionRepository = new TransactionRepository();

  async save(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<IDeliveryPartner> {
    const deliveryPartner = new DeliveryPartner(deliveryPartnerData);
    return await deliveryPartner.save();
  }

  async getUserByMobile(phone: string): Promise<IDeliveryPartner | null> {
    return DeliveryPartner.findOne({ phone });
  }

  async update(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<IDeliveryPartner> {
    const { _id, ...updateData } = deliveryPartnerData;

    const upsertedPartner = await DeliveryPartner.findOneAndUpdate(
      { _id }, // Match by _id
      { $set: updateData }, // Set the fields that need to be updated
      { new: true, upsert: true, useFindAndModify: false } // Options: return the new document, create if not exists
    )
      .lean()
      .exec();

    return upsertedPartner as IDeliveryPartner;
  }

  async getNotVerified() {
    const deliverPartner = await DeliveryPartner.find({ isVerified: false });
    return deliverPartner.filter(
      (partner) => Object.keys(partner.documents).length > 0
    );
  }

  async getVerified() {
    const deliverPartner = await DeliveryPartner.find({ isVerified: true });
    return deliverPartner;
  }

  async getById(id: string): Promise<IDeliveryPartner | null> {
    return DeliveryPartner.findById(id).lean().exec();
  }

  async getWalletBalance(partnerId: string | ObjectId): Promise<number> {
    const user = await DeliveryPartner.findById(partnerId).lean();

    if (!user) throw new Error('User not found');
    return user.walletBalance;
  }

  async debitMoneyFromWallet(
    amount: number,
    userId: string | ObjectId
  ): Promise<IDeliveryPartner | null> {
    const user = await DeliveryPartner.findById(userId).lean();

    if (!user) throw new Error('User not found');
    if (user.walletBalance < amount)
      throw new Error('Insufficient funds in wallet');

    const updatedUser = await DeliveryPartner.findByIdAndUpdate(
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
  ): Promise<IDeliveryPartner | null> {
    const user = await DeliveryPartner.findById(userId).lean();

    if (!user) throw new Error('User not found');

    const updatedUser = await DeliveryPartner.findByIdAndUpdate(
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
}
