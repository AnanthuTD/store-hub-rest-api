// subscriptionRoutes.ts
import express, { Request, Response } from 'express';
import Razorpay from 'razorpay';
import {
  SubscriptionPlan,
  SubscriptionPlanPeriods,
} from '../../../infrastructure/database/models/SubscriptionPlanModel';
import env from '../../../infrastructure/env/env';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_SECRET,
});

// Fetch all subscription plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create a subscription plan
router.post('/', async (req: Request, res: Response) => {
  const { name, price, interval, productLimit, period } = req.body;

  if (!Object.values(SubscriptionPlanPeriods).includes(period)) {
    return res.status(400).json({ error: 'Invalid period' });
  }

  try {
    // Create plan with Razorpay
    const razorpayPlan = await razorpay.plans.create({
      period,
      interval,
      item: {
        name,
        amount: price * 100,
        currency: 'INR',
      },
    });

    // Store Razorpay's plan ID as `planId` in the database
    const newPlan = new SubscriptionPlan({
      planId: razorpayPlan.id,
      name,
      price,
      interval,
      productLimit,
      period,
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    console.error('Failed to create subscription plan:', error);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
});

// Delete a subscription plan
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await SubscriptionPlan.findOneAndDelete({ planId: id }); // Delete by Razorpay's planId
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete subscription plan:', error);
    res.status(500).json({ error: 'Failed to delete subscription plan' });
  }
});

export default router;
