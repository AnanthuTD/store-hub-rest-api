import express from 'express';
import registerShop from '../../controllers/ShopOwner/registerShop.controller';
import getShopInfo from '../../controllers/ShopOwner/getShopInfo';
const router = express.Router();

router.get('/', getShopInfo);
router.post('/register', registerShop);

export default router;
