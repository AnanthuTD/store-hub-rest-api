import { Request, Response } from 'express';
import UserRepository from '../../../infrastructure/repositories/UserRepository';
import logger from '../../../infrastructure/utils/logger';
import { RazorpayService } from '../../../infrastructure/services/razorpayService';
import TransactionRepository from '../../../infrastructure/repositories/TransactionRepository';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../../../infrastructure/database/models/TransactionSchema';
import { ObjectId } from 'mongoose';
import env from '../../../infrastructure/env/env';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

export class WalletController {
  userRepository = new UserRepository();

  /**
   * Retrieves the wallet balance for the logged-in user.
   */
  async getWalletBalance(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);
      const balance = await this.userRepository.getWalletBalance(userId);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }

  /**
   * Credits money to the wallet of the logged-in user.
   */
  async creditMoneyToWallet(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const updatedUser = await this.userRepository.creditMoneyToWallet(
        amount,
        userId
      );
      res.json({
        message: 'Wallet credited successfully',
        walletBalance: updatedUser?.walletBalance,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }

  /**
   * Debits money from the wallet of the logged-in user.
   */
  async debitMoneyFromWallet(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Check if the wallet balance is sufficient
      await this.userRepository.checkWalletBalanceForDebit(amount, userId);

      const updatedUser = await this.userRepository.debitMoneyFromWallet(
        amount,
        userId
      );
      res.json({
        message: 'Wallet debited successfully',
        walletBalance: updatedUser?.walletBalance,
      });
    } catch (error) {
      if (error.message === 'Insufficient wallet balance') {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }

  /**
   * Reverts a specific transaction and adjusts the user's wallet balance accordingly.
   */
  async revertTransaction(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }

      const updatedUser = await this.userRepository.revertTransaction(
        transactionId,
        userId
      );
      res.json({
        message: 'Transaction reverted successfully',
        walletBalance: updatedUser?.walletBalance,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }

  /**
   * Retrieves the wallet transaction history for the logged-in user.
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);

      const transactions =
        await this.userRepository.transactionRepository.getTransactionsForUser(
          userId
        );
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }

  async createTransaction(req: Request, res: Response) {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const transactionData = {
      amount,
      type: TransactionType.CREDIT,
      status: TransactionStatus.PENDING,
      userId: getRequestUserId(req) as ObjectId,
      date: new Date(),
    } as ITransaction;

    const transaction = await new TransactionRepository().createTransaction(
      transactionData
    );

    try {
      const razorpayService = new RazorpayService();
      const razorpayOrder = await razorpayService.createOrder({
        amount,
      });

      if (!razorpayOrder) {
        transaction.status = TransactionStatus.FAILED;
        await transaction.save();

        return res
          .status(500)
          .json({ message: 'Failed to create payment order' });
      }

      // Success response, returning Razorpay details
      res.status(201).json({
        message: 'Order created successfully',
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: env.RAZORPAY_KEY_ID,
        transactionId: transaction._id,
      });
    } catch {
      transaction.status = TransactionStatus.FAILED;
      await transaction.save();

      res.status(500).json({
        message: 'An error occurred while creating the payment order',
      });
    }
  }

  async verifyTransaction(req: Request, res: Response) {
    const {
      razorpay_order_id,
      razorpay_signature,
      razorpay_payment_id,
      transactionId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_signature ||
      !razorpay_payment_id ||
      !transactionId
    ) {
      return res.status(400).json({ error: 'Invalid Razorpay order details' });
    }

    const verificationStatus = new RazorpayService().verifyPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    if (!verificationStatus) {
      return res
        .status(400)
        .json({ error: 'Invalid Razorpay payment details' });
    }

    const transaction = await new TransactionRepository().getTransaction(
      transactionId
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    transaction.status = TransactionStatus.SUCCESS;

    transaction.save();

    new UserRepository().creditMoneyToWallet(
      transaction.amount,
      getRequestUserId(req) as ObjectId
    );

    return res
      .status(200)
      .json({ message: 'Amount credited to wallet', transaction });
  }

  async cancelTransaction(req: Request, res: Response) {
    const { transactionId } = req.body;

    if (!transactionId) {
      res.status(404).json({ message: 'Transaction ID not provided' });
    }

    const transaction =
      await new TransactionRepository().updateTransactionStatus(
        transactionId,
        TransactionStatus.FAILED
      );

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.status(200).json({ message: 'Transaction canceled successfully' });
  }
}
