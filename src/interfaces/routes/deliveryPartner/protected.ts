import express from 'express';
import { getDocumentStatus } from '../../controllers/deliveryPartner/documentStatus.controller';
import { getProfile } from '../../controllers/deliveryPartner/profile.controller';
import upload from '../../middleware/uploadMiddleware';
import { uploadDocuments } from '../../controllers/deliveryPartner/uploadSingleDocument.controller';
const partnerRouter = express.Router();

partnerRouter.get('/profile', getProfile);

partnerRouter.get('/document/status', getDocumentStatus);

partnerRouter.post('/upload', upload.any(), uploadDocuments);

export default partnerRouter;
