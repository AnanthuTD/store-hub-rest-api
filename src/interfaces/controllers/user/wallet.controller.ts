import { Request, Response } from 'express';
import UserRepository from '../../../infrastructure/repositories/UserRepository';
import logger from '../../../infrastructure/utils/logger';

export class WalletController {
  userRepository = new UserRepository();

  /**
   * Retrieves the wallet balance for the logged-in user.
   */
  async getWalletBalance(req: Request, res: Response) {
    try {
      const userId = req.user._id;
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
      const userId = req.user._id;
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
      const userId = req.user._id;
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
      const userId = req.user._id;
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
      const userId = req.user._id;

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
}
