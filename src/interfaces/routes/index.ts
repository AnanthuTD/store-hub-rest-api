import express from 'express';
import userRouter from './user';
import adminRouter from './admin';
import partnerRouter from './deliveryPartner';
import shopOwnerRouter from './shopOwner';
import commonRouter from './common';
const router = express.Router();

router.use('/user', userRouter);

router.use('/admin', adminRouter);

router.use('/shopOwner', shopOwnerRouter);
router.use('/vendor', shopOwnerRouter);

router.use('/partner', partnerRouter);

router.use('/', commonRouter);

export default router;
