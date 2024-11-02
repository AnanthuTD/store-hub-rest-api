import express from 'express';
import authRoutes from './auth';
import productRoutes from './product';
import cartRoutes from './cart';
import categoryRoutes from './categories';
import shopsRoutes from './shops';
import orderRoutes from './order';
import passport from 'passport';
import walletRoutes from './walletRoutes';
import couponRouter from './couponRouter';
import returnRouter from './returnRouter';
import { User } from '../../../infrastructure/database/models/UserSchema';
import reviewRouter from './reviewRouter';
import chatsRouter from './chatRouter';
import notificationRouter from '../common/notificationRoutes';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';
import wishlistRouter from './wishlistRoutes';
import userBannerRouter from './bannerRoutes';

const userRouter = express.Router();

userRouter.use('/auth', authRoutes);
userRouter.use('/products', productRoutes);
userRouter.use(
  '/cart',
  passport.authenticate('jwt', { session: false }),
  cartRoutes
);
userRouter.use('/categories', categoryRoutes);
userRouter.use('/shops', shopsRoutes);
userRouter.use(
  '/order',
  passport.authenticate('jwt', { session: false }),
  orderRoutes
);
userRouter.use(
  '/wallet',
  passport.authenticate('jwt', { session: false }),
  walletRoutes
);

userRouter.use(
  '/coupons',
  passport.authenticate('jwt', { session: false }),
  couponRouter
);

userRouter.use(
  '/return',
  passport.authenticate('jwt', { session: false }),
  returnRouter
);

userRouter.post(
  '/update-fcm-token',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const userId = getRequestUserId(req);
    const { fcmToken } = req.body;

    // Check if the FCM token is provided
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required.' });
    }

    try {
      // Update the FCM token for the delivery partner
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { fcmToken } },
        { new: true }
      );

      // Check if the partner was found and updated
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found.' });
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

userRouter.use(
  '/reviews',
  passport.authenticate('jwt', { session: false }),
  reviewRouter
);

userRouter.use(
  '/chats',
  passport.authenticate('jwt', { session: false }),
  chatsRouter
);

userRouter.use(
  '/notifications',
  passport.authenticate('jwt', { session: false }),
  notificationRouter
);

userRouter.use(
  '/wishlist',
  passport.authenticate('jwt', { session: false }),
  wishlistRouter
);

userRouter.use('/banners', userBannerRouter);

export default userRouter;
