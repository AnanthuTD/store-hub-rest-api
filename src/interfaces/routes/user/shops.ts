import express from 'express';
import { getNearbyShopsWithProduct } from '../../controllers/user/getNearbyShopsWithProduct.controller';

const router = express.Router();

router.post('/nearby-with-product', getNearbyShopsWithProduct);

export default router;
