import express from 'express';
import authRouter from './auth';
const adminRouter = express.Router();

adminRouter.use('/auth', authRouter);

export default adminRouter;
