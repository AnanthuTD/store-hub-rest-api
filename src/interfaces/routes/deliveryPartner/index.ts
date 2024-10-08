import express from 'express';
import authRouter from './auth';
import protectedRoutes from './protected';
import passport from 'passport';
import locationRoutes from './locationRoutes';
import deliveryRoutes from './deliveryRouter';
import { assignDeliveryPartnerForOrder } from '../../../infrastructure/services/partnerAssignmentService';
const partnerRouter = express.Router();

partnerRouter.use('/auth', authRouter);
partnerRouter.use('/location', locationRoutes);

partnerRouter.use(
  '/',
  passport.authenticate('partner-jwt', { session: false }),
  protectedRoutes
);

partnerRouter.use(
  '/delivery',
  passport.authenticate('partner-jwt', { session: false }),
  deliveryRoutes
);

partnerRouter.get('/notify', function () {
  assignDeliveryPartnerForOrder({
    orderId: '66f6f2f973ee00f755f395e4',
    storeLongitude: 76.353775,
    storeLatitude: 9.996966,
    retryCount: 0,
  });
});

export default partnerRouter;
