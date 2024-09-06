import express from 'express';
import { getDocumentStatus } from '../../controllers/deliveryPartner/documentStatus.controller';
const partnerRouter = express.Router();

partnerRouter.get('/document/status', getDocumentStatus);

export default partnerRouter;
