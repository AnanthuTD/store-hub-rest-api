import express from 'express';
import { addProductByVendor } from '../../controllers/vendor/product/addProduct.controller';
import { upload } from '../../middleware/multerS3Config';
import { getProductsByStore } from '../../controllers/vendor/product/getProductsByStore.controller';
import { updateProduct } from '../../controllers/vendor/product/updateProduct.controller';
import searchProductsByName from '../../controllers/vendor/product/searchProductsByName';
import getProductById from '../../controllers/vendor/product/getProductById.controller';
const router = express.Router();

router.put('/:productId', upload.any(), updateProduct);

router.post('/', upload.any(), addProductByVendor);

router.get('/store/:storeId/products', getProductsByStore);

router.get('/', searchProductsByName);

router.get('/:productId', getProductById);

export default router;
