import express from 'express';
import authRouter from './auth';
import protectedRoutes from './protected';
import passport from 'passport';
import locationRoutes from './locationRoutes';
const partnerRouter = express.Router();

partnerRouter.use('/auth', authRouter);
partnerRouter.use('/location', locationRoutes);

partnerRouter.use(
  '/',
  passport.authenticate('partner-jwt', { session: false }),
  protectedRoutes
);

export default partnerRouter;
