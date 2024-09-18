import express from 'express';
import registerShop from '../../controllers/vendor/registerShop.controller';
import getShopInfo from '../../controllers/vendor/getShopInfo';
import updateShopData from '../../controllers/vendor/updateShopData.controller';
const router = express.Router();

router.get('/', getShopInfo);
router.post('/register', registerShop);
router.put('/:shopId', updateShopData);

export default router;
