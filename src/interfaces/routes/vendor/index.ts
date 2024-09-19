import express from 'express';
import authRouter from './auth';
import protectedRouter from './protected';
import productRoutes from './product';
import shopRoutes from './shop';
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
  '/',
  passport.authenticate('shop-owner-jwt', { session: false }),
  protectedRouter
);

export default shopOwnerRouter;
