import express from 'express';
import authRouter from './auth';
import partnerRouter from './partner';
import vendorRouter from './vendor';
import categoryRoutes from './category';
import passport from 'passport';
import couponRouter from './couponRouter';
import userRouter from './userRouter';
import storeRouter from './storeRouter';
import orderRouter from './orderRouter';
import chatsRouter from './chatRouter';
import dashboardRouter from './dashboardRouter';
import subscriptionRouter from './subscriptionRoutes';
import notificationRouter from '../common/notificationRoutes';

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

adminRouter.use('/users', userRouter);

adminRouter.use('/store', storeRouter);

adminRouter.use('/orders', orderRouter);

adminRouter.use(
  '/chats',
  passport.authenticate('admin-jwt', { session: false }),
  chatsRouter
);

adminRouter.use(
  '/dashboard',
  passport.authenticate('admin-jwt', { session: false }),
  dashboardRouter
);

adminRouter.use(
  '/subscription-plans',
  passport.authenticate('admin-jwt', { session: false }),
  subscriptionRouter
);

adminRouter.use(
  '/notifications',
  passport.authenticate('admin-jwt', { session: false }),
  notificationRouter
);

export default adminRouter;
