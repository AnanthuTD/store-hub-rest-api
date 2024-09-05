import express from 'express';
import upload from '../../middleware/uploadMiddleware';
import DeliveryPartnerController from '../../controllers/deliveryPartner/DeliveryPartnerController';
import VerifyOTPController from '../../controllers/deliveryPartner/VerifyOTPController';
const partnerRouter = express.Router();

partnerRouter.post('/signup', upload.any(), DeliveryPartnerController.signup);

partnerRouter.post('/otp/verify', VerifyOTPController.handle);

export default partnerRouter;
