import express from 'express';
import authRouter from './auth';
import protectedRoutes from './protected';
import passport from 'passport';
import locationRoutes from './locationRoutes';
import deliveryRoutes from './deliveryRouter';
import { assignDeliveryPartnerForOrder } from '../../../infrastructure/services/partnerAssignmentService';
import orderRouter from './orderRouter';
import DeliveryPartner from '../../../infrastructure/database/models/DeliveryPartner';
import { FCMRoles } from '../../../config/firebase.config';
import fcmService from '../../../infrastructure/services/fcmService';
const partnerRouter = express.Router();

partnerRouter.use('/auth', authRouter);
partnerRouter.use('/location', locationRoutes);

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

partnerRouter.use(
  '/orders',
  passport.authenticate('partner-jwt', { session: false }),
  orderRouter
);

partnerRouter.post(
  '/update-fcm-token',
  passport.authenticate('partner-jwt', { session: false }),
  async (req, res) => {
    const partnerId = req.user._id;
    const { fcmToken } = req.body;

    console.log('partner fcm token: ' + fcmToken);

    // Check if the FCM token is provided
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required.' });
    }

    try {
      // Update the FCM token for the delivery partner
      const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        partnerId,
        { $set: { fcmToken } },
        { new: true }
      );

      // Check if the partner was found and updated
      if (!updatedPartner) {
        return res.status(404).json({ message: 'Delivery partner not found.' });
      }

      // Send a success response
      res.status(200).json({ message: 'FCM token updated successfully.' });
    } catch (error) {
      console.error('Error updating FCM token:', error);
      res
        .status(500)
        .json({ message: 'An error occurred while updating the FCM token.' });
    }
  }
);

partnerRouter.get('/push-notification', async (req, res) => {
  try {
    // Fetch the partner's FCM token from the database
    const partner = await DeliveryPartner.findById('66fea10028cfa061c31eff33', {
      fcmToken: 1,
    });

    console.log(partner);

    // Check if the partner was found and has an FCM token
    if (!partner || !partner.fcmToken) {
      return res
        .status(404)
        .json({ message: 'Partner not found or FCM token not available.' });
    }

    const registrationToken = partner.fcmToken;

    // Construct the message to be sent
    const message = {
      data: {
        score: '850',
        time: '2:45',
        role: FCMRoles.DELIVERY_PARTNER,
      },
      token: registrationToken,
    };

    // send push notification to user
    fcmService.sendMessageToUser(message);

    console.log('Successfully sent message');

    // Send a success response back to the client
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: 'An error occurred while sending the notification.',
      error: error.message,
    });
  }
});

partnerRouter.use(
  '/',
  passport.authenticate('partner-jwt', { session: false }),
  protectedRoutes
);

export default partnerRouter;
