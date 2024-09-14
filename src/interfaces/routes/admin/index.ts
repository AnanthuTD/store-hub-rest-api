import express from 'express';
import authRouter from './auth';
import partnerRouter from './partner';
import vendorRouter from './vendor';
import passport from 'passport';
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

export default adminRouter;
