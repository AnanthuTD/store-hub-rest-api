import express from 'express';
import authRouter from './auth';
import partnerRouter from './partner';
const adminRouter = express.Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/partner', partnerRouter);

export default adminRouter;
