import express from 'express';
import { addProductByVendor } from '../../controllers/ShopOwner/addProduct.controller';
import { upload } from '../../middleware/multerS3Config';
import { getProductsByStore } from '../../controllers/ShopOwner/getProductsByStore.controller';
import { updateProduct } from '../../controllers/ShopOwner/updateProduct.controller';
const router = express.Router();

router.put('/:productId', upload.any(), updateProduct);

router.post('/', upload.any(), addProductByVendor);

router.get('/store/:storeId/products', getProductsByStore);

export default router;
