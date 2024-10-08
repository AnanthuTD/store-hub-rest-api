import express from 'express';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import getShopOwnerWithDocuments from '../../controllers/admin/vendor/getShopOwnerWithDocuments.controller';
import { validateDocumentsController } from '../../controllers/admin/vendor/validateDoc.controller';
const adminRouter = express.Router();

const vendorRepo = new VendorOwnerRepository();

adminRouter.get('/list/unverified', async (req, res) => {
  const unverifiedVendors = await vendorRepo.getNotVerified();
  return res.json(unverifiedVendors);
});

adminRouter.get('/list/verified', async (req, res) => {
  const verifiedVendors = await vendorRepo.getVerified();
  console.log(verifiedVendors);

  return res.json(verifiedVendors);
});

adminRouter.get('/:vendorId', getShopOwnerWithDocuments);

adminRouter.post('/:vendorId/validateDocuments', validateDocumentsController);

export default adminRouter;
