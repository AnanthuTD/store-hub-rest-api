import express from 'express';
import { ShopOwnerRepository } from '../../../infrastructure/repositories/ShopOwnerRepository';
import getShopOwnerWithDocuments from '../../controllers/admin/getShopOwnerWithDocuments.controller';
import { validateDocumentsController } from '../../controllers/admin/validateDoc.controller';
const adminRouter = express.Router();

const vendorRepo = new ShopOwnerRepository();

adminRouter.get('/list/pending', async (req, res) => {
  const notVerifiedPartners = await vendorRepo.getNotVerified();
  return res.json(notVerifiedPartners);
});

adminRouter.get('/:vendorId', getShopOwnerWithDocuments);

adminRouter.post('/:vendorId/validateDocuments', validateDocumentsController);

export default adminRouter;
