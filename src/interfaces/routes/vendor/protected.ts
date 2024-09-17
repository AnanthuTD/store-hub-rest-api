import express from 'express';
import updateShopOwner from '../../controllers/ShopOwner/RegisterShopOwnerController';
import uploadDocuments from '../../controllers/ShopOwner/uploadDocuments.controller';
const shopOwnerRouter = express.Router();

shopOwnerRouter.post('/register', updateShopOwner);

shopOwnerRouter.post('/documents/upload', uploadDocuments);

export default shopOwnerRouter;
