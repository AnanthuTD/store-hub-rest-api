import express from 'express';
import { searchProducts } from '../../controllers/user/searchProducts';
import { suggestProducts } from '../../controllers/user/suggestProducts.controller';
import getProductDetailsController from '../../controllers/user/getProductDetails.controller';
import getShopsByProductsController from '../../controllers/user/getShopsByProducts.controller';

const userRouter = express.Router();

userRouter.get('/search', searchProducts);
userRouter.get('/suggest', suggestProducts);
userRouter.get('/:productId/details', getProductDetailsController);
userRouter.get('/:productId/:variantId/shops', getShopsByProductsController);

export default userRouter;
