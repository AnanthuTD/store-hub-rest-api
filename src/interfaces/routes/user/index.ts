import express from 'express';
import authRoutes from './auth';
import productRoutes from './product';
import cartRoutes from './cart';
import categoryRoutes from './categories';
import passport from 'passport';

const userRouter = express.Router();

userRouter.use('/auth', authRoutes);
userRouter.use('/products', productRoutes);
userRouter.use(
  '/cart',
  passport.authenticate('jwt', { session: false }),
  cartRoutes
);
userRouter.use('/categories', categoryRoutes);

export default userRouter;
