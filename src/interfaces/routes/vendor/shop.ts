import express from 'express';
import getShopInfo from '../../controllers/vendor/shop/getShopInfo';
import updateShopData from '../../controllers/vendor/shop/updateShopData.controller';
import registerShop from '../../controllers/vendor/shop/registerShop.controller';
const router = express.Router();

router.get('/', getShopInfo);
router.post('/register', registerShop);
router.put('/:shopId', updateShopData);

export default router;
