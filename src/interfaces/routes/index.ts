import express from 'express';
import userRouter from './user';
import adminRouter from './admin';
import partnerRouter from './deliveryPartner';
import vendorRouter from './vendor';
import commonRouter from './common';
const router = express.Router();

router.use('/user', userRouter);

router.use('/admin', adminRouter);

router.use('/vendor', vendorRouter);

router.use('/partner', partnerRouter);

router.use('/', commonRouter);

export default router;
