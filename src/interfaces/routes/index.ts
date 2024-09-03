import express from 'express';
import userRouter from './user';
import adminRouter from './admin';
import ShopOwnerRouter from './shopOwner';
import partnerRouter from './deliveryPartner';
const router = express.Router();

router.use('/user', userRouter);

router.use('/admin', adminRouter);

router.use('/shopOwner', ShopOwnerRouter);

router.use('/partner', partnerRouter);

export default router;
