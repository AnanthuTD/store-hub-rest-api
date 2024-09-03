import express from 'express';
import userRouter from './user';
import adminRouter from './admin';
import ShopOwnerRouter from './shopOwner';
import partnerRouter from './deliveryPartner';
import commonRouter from './common';
const router = express.Router();

router.use('/user', userRouter);

router.use('/admin', adminRouter);

router.use('/shopOwner', ShopOwnerRouter);

router.use('/partner', partnerRouter);

router.use('/', commonRouter);

export default router;
