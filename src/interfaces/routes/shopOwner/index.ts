import express from 'express';
import authRouter from './auth';
import protectedRouter from './protected';
import passport from 'passport';
const shopOwnerRouter = express.Router();

shopOwnerRouter.use('/auth', authRouter);

shopOwnerRouter.use(
  '/',
  passport.authenticate('shop-owner-jwt', { session: false }),
  protectedRouter
);

export default shopOwnerRouter;
