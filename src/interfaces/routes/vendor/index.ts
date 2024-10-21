import express from 'express';
import authRouter from './auth';
import protectedRouter from './protected';
import productRoutes from './product';
import shopRoutes from './shop';
import orderRoutes from './orders';
import passport from 'passport';
import returnRouter from './returnRouter';
import walletRouter from './walletRoutes';
import subscriptionRouter from './subscriptionRouter';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import VendorSubscriptionModel, {
  SubscriptionStatus,
} from '../../../infrastructure/database/models/VendorSubscriptionModal';
import crypto from 'node:crypto';
import env from '../../../infrastructure/env/env';

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

async function handleSubscriptionUpdate(subscriptionId, status) {
  try {
    await new VendorOwnerRepository().updateVendorSubscription(subscriptionId, {
      status,
    });
    console.log(`Subscription ${subscriptionId} status updated to ${status}`);
  } catch (error) {
    console.error(`Failed to update subscription ${subscriptionId}:`, error);
  }
}

async function updatePaidCount(subscriptionId) {
  try {
    const subscription = await VendorSubscriptionModel.findOne({
      razorpaySubscriptionId: subscriptionId,
    });

    if (subscription) {
      subscription.paidCount += 1;
      await subscription.save();
      console.log(`Paid count updated for subscription ${subscriptionId}`);
    }
  } catch (error) {
    console.error(`Failed to update paid count for ${subscriptionId}:`, error);
  }
}

vendor.post(
  '/webhook/subscriptions',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const razorpaySignature = req.headers['x-razorpay-signature'];
      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
      const payload = req.body;

      console.log(payload);

      // Verify the Razorpay webhook signature
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body;
      console.log('Webhook event:', event);

      const subscription = event.payload.subscription.entity;
      const subscriptionId = subscription.id;
      const status = subscription.status; // Captures the latest status from Razorpay

      // Handling different subscription events
      switch (event.event) {
        case 'subscription.authenticated':
          console.log('Subscription authenticated:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.AUTHENTICATED
          );
          break;

        case 'subscription.activated':
          console.log('Subscription activated:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.ACTIVE
          );
          break;

        case 'subscription.charged':
          console.log('Subscription charged:', subscriptionId);
          await updatePaidCount(subscriptionId);
          break;

        case 'subscription.completed':
          console.log('Subscription completed:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.COMPLETED
          );
          break;

        case 'subscription.updated':
          console.log('Subscription updated:', subscriptionId);
          await handleSubscriptionUpdate(subscriptionId, status);
          break;

        case 'subscription.pending':
          console.log('Subscription pending:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.PENDING
          );
          break;

        case 'subscription.halted':
          console.log('Subscription halted:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.HALTED
          );
          break;

        case 'subscription.cancelled':
          console.log('Subscription cancelled:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.HALTED
          );
          break;

        case 'subscription.paused':
          console.log('Subscription paused:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.PAUSED
          );
          break;

        case 'subscription.resumed':
          console.log('Subscription resumed:', subscriptionId);
          await handleSubscriptionUpdate(
            subscriptionId,
            SubscriptionStatus.RESUMED
          );
          break;

        default:
          console.log(`Unhandled event: ${event.event}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send();
    }
  }
);

vendor.use(
  '/',
  passport.authenticate('shop-owner-jwt', { session: false }),
  protectedRouter
);

export default vendor;
