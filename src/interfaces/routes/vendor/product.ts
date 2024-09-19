import express from 'express';
import { addProductByVendor } from '../../controllers/vendor/addProduct.controller';
import { upload } from '../../middleware/multerS3Config';
import { getProductsByStore } from '../../controllers/vendor/getProductsByStore.controller';
import { updateProduct } from '../../controllers/vendor/updateProduct.controller';
import searchProductsByName from '../../controllers/vendor/searchProductsByName';
import getProductById from '../../controllers/vendor/getProductById.controller';
const router = express.Router();

router.put('/:productId', upload.any(), updateProduct);

router.post('/', upload.any(), addProductByVendor);

router.get('/store/:storeId/products', getProductsByStore);

router.get('/', searchProductsByName);

router.get('/:productId', getProductById);

export default router;
