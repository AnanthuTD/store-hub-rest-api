import express from 'express';
import authRouter from './auth';
import partnerRouter from './partner';
import vendorRouter from './vendor';
import categoryRoutes from './category';
import passport from 'passport';
import couponRouter from './couponRouter';
const adminRouter = express.Router();

adminRouter.use('/auth', authRouter);
adminRouter.use(
  '/partner',
  passport.authenticate('admin-jwt', { session: false }),
  partnerRouter
);
adminRouter.use(
  '/vendor',
  passport.authenticate('admin-jwt', { session: false }),
  vendorRouter
);
adminRouter.use('/categories', categoryRoutes);

adminRouter.use(
  '/coupons',
  passport.authenticate('admin-jwt', { session: false }),
  couponRouter
);

export default adminRouter;
