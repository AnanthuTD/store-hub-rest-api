import { Router } from 'express';
import { WalletController } from '../../controllers/deliveryPartner/wallet.controller';

const walletController = new WalletController();
const walletRouter = Router();

walletRouter.get(
  '/balance',
  walletController.getWalletBalance.bind(walletController)
);

walletRouter.get(
  '/transactions',
  walletController.getTransactionHistory.bind(walletController)
);

export default walletRouter;
