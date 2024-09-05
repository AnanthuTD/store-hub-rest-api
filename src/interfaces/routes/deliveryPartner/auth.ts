import express from 'express';
import upload from '../../middleware/uploadMiddleware';
import DeliveryPartnerController from '../../controllers/deliveryPartner/DeliveryPartnerController';
import VerifyOTPController from '../../controllers/deliveryPartner/VerifyOTPController';
const shopOwnerRouter = express.Router();

shopOwnerRouter.post('/signup', upload.any(), DeliveryPartnerController.signup);

shopOwnerRouter.post('/otp/verify', VerifyOTPController.handle);

export default shopOwnerRouter;
