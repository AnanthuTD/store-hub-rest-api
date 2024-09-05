import express from 'express';
import authRouter from './auth';
import partnerRouter from './partner';
import passport from 'passport';
const adminRouter = express.Router();

adminRouter.use('/auth', authRouter);
adminRouter.use(
  '/partner',
  passport.authenticate('admin-jwt', { session: false }),
  partnerRouter
);

export default adminRouter;
