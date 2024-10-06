import { injectable } from 'inversify';
import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../database/models/UserSchema';
import { ObjectId } from 'mongoose';
import TransactionRepository from './TransactionRepository';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../database/models/TransactionSchema';

@injectable()
class UserRepository implements IUserRepository {
  transactionRepository = new TransactionRepository();

  async create(user: IUser): Promise<IUser> {
    const newUser = new User(user);
    return newUser.save();
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async getUserById(id: string | ObjectId): Promise<IUser | null> {
    return User.findById(id);
  }

  async getUserByMobile(mobileNumber: string): Promise<IUser | null> {
    return User.findOne({ mobileNumber });
  }

  /**
   * Credits money to the user's wallet and logs the transaction.
   *
   * @param amount - The amount to be credited to the wallet.
   * @param userId - The unique identifier of the user.
   * @returns The updated user with the new wallet balance.
   */
  async creditMoneyToWallet(
    amount: number,
    userId: string | ObjectId
  ): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    ).lean();

    if (!user) throw new Error('User not found');

    return user;
  }

  /**
   * Debits money from the user's wallet if they have enough balance.
   *
   * @param amount - The amount to be debited from the wallet.
   * @param userId - The unique identifier of the user.
   * @returns The updated user with the new wallet balance or throws an error if insufficient funds.
   */
  async debitMoneyFromWallet(
    amount: number,
    userId: string | ObjectId
  ): Promise<IUser | null> {
    const user = await User.findById(userId).lean();

    if (!user) throw new Error('User not found');
    if (user.walletBalance < amount)
      throw new Error('Insufficient funds in wallet');

    const updatedUser = await User.findByIdAndUpdate(
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

  /**
   * Gets the current wallet balance of a user.
   *
   * @param userId - The unique identifier of the user.
   * @returns The wallet balance of the user.
   */
  async getWalletBalance(userId: string | ObjectId): Promise<number> {
    const user = await User.findById(userId).lean();

    if (!user) throw new Error('User not found');
    return user.walletBalance;
  }

  /**
   * Reverts a transaction and updates the user's wallet balance.
   *
   * @param transactionId - The unique identifier of the transaction.
   * @param userId - The unique identifier of the user.
   * @returns The updated user or throws an error if the transaction cannot be reverted.
   */
  async revertTransaction(
    transactionId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<IUser | null> {
    const transaction =
      await this.transactionRepository.getTransaction(transactionId);

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === TransactionStatus.FAILED)
      throw new Error('Cannot revert a failed transaction');

    const revertAmount =
      transaction.type === TransactionType.CREDIT
        ? -transaction.amount
        : transaction.amount;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: revertAmount } },
      { new: true }
    ).lean();

    if (!updatedUser)
      throw new Error('Error reverting transaction and updating user balance');

    // Update the transaction status to "REVERTED" or "FAILED"
    await this.transactionRepository.updateTransactionStatus(
      transactionId,
      TransactionStatus.FAILED
    );

    return updatedUser;
  }

  /**
   * Ensures that the user's wallet has enough balance before debiting.
   *
   * @param amount - The amount to be debited.
   * @param userId - The unique identifier of the user.
   * @returns `true` if the balance is sufficient, otherwise throws an error.
   */
  async checkWalletBalanceForDebit(
    amount: number,
    userId: string | ObjectId
  ): Promise<boolean> {
    const user = await User.findById(userId).lean();

    if (!user) throw new Error('User not found');
    if (user.walletBalance < amount)
      throw new Error('Insufficient wallet balance');

    return true;
  }
}

export default UserRepository;
