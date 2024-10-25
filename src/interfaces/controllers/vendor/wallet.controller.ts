import { Request, Response } from 'express';
import logger from '../../../infrastructure/utils/logger';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

export class WalletController {
  vendorRepository = new VendorOwnerRepository();

  /**
   * Retrieves the wallet balance for the logged-in user.
   */
  async getWalletBalance(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);
      const balance = await this.vendorRepository.getWalletBalance(userId);
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

      const updatedUser = await this.vendorRepository.creditMoneyToWallet(
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

      const updatedUser = await this.vendorRepository.debitMoneyFromWallet(
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
   * Retrieves the wallet transaction history for the logged-in user.
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const userId = getRequestUserId(req);

      const transactions =
        await this.vendorRepository.transactionRepository.getTransactionsForUser(
          userId
        );
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
      logger.error(error?.message);
    }
  }
}
