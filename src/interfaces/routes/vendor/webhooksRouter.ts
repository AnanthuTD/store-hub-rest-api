import VendorSubscriptionModel, {
  SubscriptionStatus,
} from '../../../infrastructure/database/models/VendorSubscriptionModal';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import express from 'express';
const webhookRouter = express.Router();
import crypto from 'node:crypto';

async function handleSubscriptionUpdate(
  subscriptionId,
  status: SubscriptionStatus,
  eventTimestamp,
  startDate,
  endDate,
  chargeAt,
  paidCount
) {
  try {
    await new VendorOwnerRepository().updateVendorSubscription(subscriptionId, {
      status,
      updatedAt: eventTimestamp,
      startDate,
      endDate,
      chargeAt,
    });

    updatePaidCount(status, paidCount);
    console.log(`Subscription ${subscriptionId} status updated to ${status}`);
  } catch (error) {
    console.error(`Failed to update subscription ${subscriptionId}:`, error);
  }
}

async function updatePaidCount(subscriptionId, paidCount) {
  try {
    const subscription = await VendorSubscriptionModel.findOne({
      razorpaySubscriptionId: subscriptionId,
    });

    if (subscription) {
      subscription.paidCount = paidCount;
      await subscription.save();
      console.log(`Paid count updated for subscription ${subscriptionId}`);
    }
  } catch (error) {
    console.error(`Failed to update paid count for ${subscriptionId}:`, error);
  }
}
webhookRouter.post(
  '/subscriptions',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const razorpaySignature = req.headers['x-razorpay-signature'];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const payload = req.body;

      // Verify the Razorpay webhook signature
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = payload;
      console.log('Webhook event:', event);

      const subscription = event.payload.subscription.entity;
      const subscriptionId = subscription.id;
      const eventTimestamp = event.created_at;
      const startDate = new Date(subscription.start_at * 1000);
      const endDate = new Date(subscription.end_at * 1000);
      const chargeAt = new Date(subscription.charge_at * 1000);
      const paidCount = subscription.paid_count;

      // Fetch current subscription state
      const currentSubscription = await getCurrentSubscription(subscriptionId);

      // Check if the event is relevant and can be processed
      if (isEventRelevant(event.event, currentSubscription, eventTimestamp)) {
        await handleSubscriptionUpdate(
          subscriptionId,
          SubscriptionStatus.AUTHENTICATED,
          eventTimestamp,
          startDate,
          endDate,
          chargeAt,
          paidCount
        );
      } else {
        console.log(
          `Ignoring event ${event.event} for subscription ${subscriptionId} as it has been processed or is in a final state.`
        );
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send();
    }
  }
);

// Helper functions
async function getCurrentSubscription(subscriptionId) {
  return await VendorSubscriptionModel.findOne({
    razorpaySubscriptionId: subscriptionId,
  }).select('status updatedAt');
}

function isEventRelevant(eventType, currentSubscription, eventTimestamp) {
  const finalStates = [
    'active',
    'halted',
    'completed',
    'reversed',
    'processed',
  ];
  // Check if current status is final and if the incoming event is older than the last update
  return (
    !finalStates.includes(currentSubscription?.status) ||
    eventType === 'subscription.updated' ||
    eventTimestamp > currentSubscription.updatedAt
  );
}

export default webhookRouter;
