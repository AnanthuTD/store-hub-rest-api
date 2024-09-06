import express from 'express';
import authRouter from './auth';
const shopOwnerRouter = express.Router();

shopOwnerRouter.use('/auth', authRouter);

export default shopOwnerRouter;
