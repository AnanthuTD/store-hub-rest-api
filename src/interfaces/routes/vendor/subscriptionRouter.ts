import express from 'express';
import { RazorpayService } from '../../../infrastructure/services/razorpayService';
import { VendorOwnerRepository } from '../../../infrastructure/repositories/VendorRepository';
import env from '../../../infrastructure/env/env';
import { SubscriptionPlan } from '../../../infrastructure/database/models/SubscriptionPlanModel';
import VendorSubscriptionModel, {
  SubscriptionStatus,
} from '../../../infrastructure/database/models/VendorSubscriptionModal';
import { validateProductCountForPlan } from './validateProductCountForPlan';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';
import { checkIsVerified } from '../../controllers/vendor/checkIsVerified';

const subscriptionRouter = express.Router();

subscriptionRouter.get('/canSubscribe', async (req, res) => {
  const vendorId = req.user._id;

  const { isVerified, message } = await checkIsVerified(vendorId);

  if (!isVerified) {
    return res.status(400).json({ message });
  }
});

subscriptionRouter.post('/subscribe', async (req, res) => {
  try {
    const { planId } = req.body;
    const vendorId = getRequestUserId(req);

    const vendorData = await new VendorOwnerRepository().findById(vendorId);
    if (!vendorData) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const { isVerified, message } = await checkIsVerified(vendorId);

    if (!isVerified) {
      return res.status(400).json({ message });
    }

    // Check for an existing active subscription
    const existingSubscription = await VendorSubscriptionModel.findOne({
      vendorId,
      status: SubscriptionStatus.ACTIVE,
    });

    if (existingSubscription) {
      return res
        .status(400)
        .json({ message: 'Vendor already has an active subscription.' });
    }

    const subscriptionPlan = await SubscriptionPlan.findOne({ planId });
    if (!subscriptionPlan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    console.log(subscriptionPlan);

    await validateProductCountForPlan(vendorId, subscriptionPlan.planId);

    const razorpayResponse = await new RazorpayService().subscribe({
      notify_email: vendorData.email,
      notify_phone: vendorData.phone,
      totalCount: 12, // for 12 cycle.
      planId: subscriptionPlan.planId,
    });

    console.log('Razorpay Response:', razorpayResponse);

    if (!razorpayResponse || !razorpayResponse.id) {
      return res
        .status(500)
        .json({ error: 'Failed to create subscription on Razorpay' });
    }

    const newSubscription =
      await new VendorOwnerRepository().createVendorSubscription(
        vendorId,
        razorpayResponse,
        subscriptionPlan
      );

    return res.status(201).json({
      ...newSubscription.toJSON(),
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res
      .status(500)
      .json({ error: 'Internal server error', message: error.message });
  }
});

subscriptionRouter.get('/', async (req, res) => {
  try {
    const vendorId = getRequestUserId(req);
    let subscriptions = await new VendorOwnerRepository()
      .getVendorSubscription(vendorId)
      .lean();

    subscriptions = subscriptions.map((sub) => ({
      ...sub,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    }));

    return res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});

subscriptionRouter.get('/plans', async (req, res) => {
  try {
    const vendorId = getRequestUserId(req);

    const subscriptionPlans = await SubscriptionPlan.find({}).lean();

    if (!subscriptionPlans || subscriptionPlans.length === 0) {
      return res.status(404).json({ message: 'No subscription plans found' });
    }

    const activeSubscription = await VendorSubscriptionModel.findOne({
      vendorId,
      status: SubscriptionStatus.ACTIVE,
    }).lean();

    const plansWithActiveStatus = subscriptionPlans.map((plan) => ({
      ...plan,
      active: activeSubscription && activeSubscription.planId === plan.planId,
    }));

    return res.json({ plans: plansWithActiveStatus, activeSubscription });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

subscriptionRouter.post('/cancel', async (req, res) => {
  const vendorId = getRequestUserId(req);

  try {
    const vendor = await new VendorOwnerRepository().findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Call the cancelVendorSubscription method
    const result = await new VendorOwnerRepository().cancelVendorSubscription(
      vendorId
    );

    return res.status(200).json({
      message: result.message,
      status: result.status,
      razorpaySubscriptionId: result?.razorpaySubscriptionId,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({
      message: 'Failed to cancel subscription',
      error: error.message,
    });
  }
});

export default subscriptionRouter;
