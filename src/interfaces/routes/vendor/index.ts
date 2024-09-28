import express from 'express';
import authRouter from './auth';
import protectedRouter from './protected';
import productRoutes from './product';
import shopRoutes from './shop';
import orderRoutes from './orders';
import passport from 'passport';
const shopOwnerRouter = express.Router();

shopOwnerRouter.use('/auth', authRouter);

shopOwnerRouter.use(
  '/products',
  passport.authenticate('shop-owner-jwt', { session: false }),
  productRoutes
);

shopOwnerRouter.use(
  '/shop',
  passport.authenticate('shop-owner-jwt', { session: false }),
  shopRoutes
);

shopOwnerRouter.use(
  '/orders',
  passport.authenticate('shop-owner-jwt', { session: false }),
  orderRoutes
);

shopOwnerRouter.use(
  '/',
  passport.authenticate('shop-owner-jwt', { session: false }),
  protectedRouter
);

export default shopOwnerRouter;
