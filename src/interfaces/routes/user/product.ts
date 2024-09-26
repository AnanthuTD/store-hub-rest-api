import express from 'express';
import { searchProducts } from '../../controllers/user/product/searchProducts';
import getShopsByProductsController from '../../controllers/user/product/getShopsByProducts.controller';
import getProductDetailsController from '../../controllers/user/product/getProductDetails.controller';
import { suggestProducts } from '../../controllers/user/product/suggestProducts.controller';
import { getPopularProductsFromRandomCategories } from '../../controllers/user/product/getPopularProductsFromRandomCategories.controller';
import { getProductsByCategoryOrSearch } from '../../controllers/user/product/getProductByCategory';
import getStoreProductDetails from '../../controllers/user/product/getStoreProductDetails.controller';
import { getCategorizedPopularProducts } from '../../controllers/user/product/storeProducts/getCategorizedPopularProducts';

const userRouter = express.Router();

userRouter.get('/search', searchProducts);
userRouter.get('/suggest', suggestProducts);
userRouter.get('/:productId/details', getProductDetailsController);
userRouter.get('/shop/:productId/details', getStoreProductDetails);
userRouter.get('/:productId/:variantId/shops', getShopsByProductsController);
userRouter.get(
  '/popular-by-random-categories',
  getPopularProductsFromRandomCategories
);
userRouter.get(
  '/popular-by-random-categories/v2',
  getCategorizedPopularProducts
);
userRouter.get('/category/:categoryId', getProductsByCategoryOrSearch);

export default userRouter;
