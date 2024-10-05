import { Router } from 'express';
import { WalletController } from '../../controllers/user/wallet.controller';

const walletController = new WalletController();
const walletRouter = Router();

walletRouter.get(
  '/balance',
  walletController.getWalletBalance.bind(walletController)
);
walletRouter.post(
  '/revert',
  walletController.revertTransaction.bind(walletController)
);
walletRouter.get(
  '/transactions',
  walletController.getTransactionHistory.bind(walletController)
);
walletRouter.post(
  '/transaction/create',
  walletController.createTransaction.bind(walletController)
);
walletRouter.post(
  '/transaction/verify',
  walletController.verifyTransaction.bind(walletController)
);
walletRouter.post(
  '/transaction/cancel',
  walletController.cancelTransaction.bind(walletController)
);

export default walletRouter;
