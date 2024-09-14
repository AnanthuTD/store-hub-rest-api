import express from 'express';
import { addProductByVendor } from '../../controllers/ShopOwner/addProduct.controller';
import { upload } from '../../middleware/multerS3Config';
const router = express.Router();

router.post('/', upload.any(), addProductByVendor);

export default router;
