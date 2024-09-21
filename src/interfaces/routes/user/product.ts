import express from 'express';
import { searchProducts } from '../../controllers/user/product/searchProducts';
import getShopsByProductsController from '../../controllers/user/product/getShopsByProducts.controller';
import getProductDetailsController from '../../controllers/user/product/getProductDetails.controller';
import { suggestProducts } from '../../controllers/user/product/suggestProducts.controller';

const userRouter = express.Router();

userRouter.get('/search', searchProducts);
userRouter.get('/suggest', suggestProducts);
userRouter.get('/:productId/details', getProductDetailsController);
userRouter.get('/:productId/:variantId/shops', getShopsByProductsController);

export default userRouter;
