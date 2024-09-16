import express from 'express';
import authRoutes from './auth';
import productRoutes from './product';

const userRouter = express.Router();

userRouter.use('/auth', authRoutes);
userRouter.use('/products', productRoutes);

export default userRouter;
