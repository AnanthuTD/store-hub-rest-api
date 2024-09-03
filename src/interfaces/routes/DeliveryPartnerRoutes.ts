import express from 'express';
import upload from '../middleware/uploadMiddleware';
import DeliveryPartnerController from '../controllers/deliveryPartner/DeliveryPartnerController';
import VerifyOTPController from '../controllers/deliveryPartner/VerifyOTPController';

const router = express.Router();

router.post(
  '/signup',
  upload.any(),
  DeliveryPartnerController.signup,
  (req, res) => {
    // Handle files and other form fields
    console.log(req.files); // Contains uploaded files
    console.log(req.body); // Contains other form fields

    // Respond to the client
    res.send('Form data and files uploaded successfully');
  }
);

router.post(
  '/signup/personal',
  upload.single('avatar'),
  DeliveryPartnerController.signup
);

router.post('/otp/verify', VerifyOTPController.handle);

export default router;
