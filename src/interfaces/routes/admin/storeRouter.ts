import express from 'express';
import adminShopController from '../../controllers/admin/adminShopController';
const storeRouter = express.Router();

storeRouter.get('/', adminShopController.getShops);
storeRouter.get('/details', adminShopController.getShopById);
storeRouter.get('/products', adminShopController.getShopProducts);

export default storeRouter;
