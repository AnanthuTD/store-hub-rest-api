import express from 'express';
import authRoutes from './auth';

const userRouter = express.Router();

userRouter.use('/auth', authRoutes);

export default userRouter;
