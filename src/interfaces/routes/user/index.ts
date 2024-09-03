import express from 'express';
import authRoutes from './authRoutes';

const userRouter = express.Router();

userRouter.get('/auth', authRoutes);

export default userRouter;
