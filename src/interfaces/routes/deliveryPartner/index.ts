import express from 'express';
import authRouter from './auth';
const partnerRouter = express.Router();

partnerRouter.use('/auth', authRouter);

export default partnerRouter;
