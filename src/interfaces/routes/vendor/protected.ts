import express from 'express';
import updateShopOwner from '../../controllers/vendor/RegisterShopOwnerController';
import uploadDocuments from '../../controllers/vendor/uploadDocuments.controller';
const shopOwnerRouter = express.Router();

shopOwnerRouter.post('/register', updateShopOwner);

shopOwnerRouter.post('/documents/upload', uploadDocuments);

export default shopOwnerRouter;
