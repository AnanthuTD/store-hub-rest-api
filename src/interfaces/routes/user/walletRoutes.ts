import { Router } from 'express';
import { WalletController } from '../../controllers/user/wallet.controller';

const walletController = new WalletController();
const walletRouter = Router();

walletRouter.get('/balance', walletController.getWalletBalance);
walletRouter.post('/credit', walletController.creditMoneyToWallet);
walletRouter.post('/debit', walletController.debitMoneyFromWallet);
walletRouter.post('/revert', walletController.revertTransaction);
walletRouter.get('/transactions', walletController.getTransactionHistory);

export default walletRouter;
