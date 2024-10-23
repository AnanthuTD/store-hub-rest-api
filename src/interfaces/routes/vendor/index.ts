import express from 'express';
import authRouter from './auth';
import protectedRouter from './protected';
import productRoutes from './product';
import shopRoutes from './shop';
import orderRoutes from './orders';
import passport from 'passport';
import returnRouter from './returnRouter';
import walletRouter from './walletRoutes';
import dashboardRouter from './dashboardRouter';
import subscriptionRouter from './subscriptionRouter';
import webhookRouter from './webhooksRouter';
import notificationRouter from '../common/notificationRoutes';

const vendor = express.Router();

vendor.use('/auth', authRouter);

vendor.use(
  '/products',
  passport.authenticate('shop-owner-jwt', { session: false }),
  productRoutes
);

vendor.use(
  '/shop',
  passport.authenticate('shop-owner-jwt', { session: false }),
  shopRoutes
);

vendor.use(
  '/orders',
  passport.authenticate('shop-owner-jwt', { session: false }),
  orderRoutes
);

vendor.use(
  '/return',
  passport.authenticate('shop-owner-jwt', { session: false }),
  returnRouter
);

vendor.use(
  '/wallet',
  passport.authenticate('shop-owner-jwt', { session: false }),
  walletRouter
);

vendor.use(
  '/subscriptions',
  passport.authenticate('shop-owner-jwt', { session: false }),
  subscriptionRouter
);

vendor.use('/webhooks', webhookRouter);

vendor.use(
  '/dashboard',
  passport.authenticate('shop-owner-jwt', { session: false }),
  dashboardRouter
);

vendor.use(
  '/notifications',
  passport.authenticate('shop-owner-jwt', { session: false }),
  notificationRouter
);

vendor.use(
  '/',
  passport.authenticate('shop-owner-jwt', { session: false }),
  protectedRouter
);

export default vendor;
