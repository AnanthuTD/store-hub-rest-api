import express from 'express';
import registerShop from '../../controllers/ShopOwner/registerShop.controller';
import getShopInfo from '../../controllers/ShopOwner/getShopInfo';
import updateShopData from '../../controllers/ShopOwner/updateShopData.controller';
const router = express.Router();

router.get('/', getShopInfo);
router.post('/register', registerShop);
router.put('/:shopId', updateShopData);

export default router;
