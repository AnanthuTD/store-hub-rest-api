import express from 'express';
import { getNearbyShops } from '../../controllers/user/shops/getNearbyShops.controller';
import { getNearbyShopsWithProduct } from '../../controllers/user/shops/getNearbyShopsWithProduct.controller';

const router = express.Router();

router.post('/nearby-with-product', getNearbyShopsWithProduct);
router.get('/nearby', getNearbyShops);

export default router;
