import mongoose, { Document, Schema } from 'mongoose';

export enum SubscriptionPlanPeriods {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  Quarterly = 'quarterly',
}

export interface ISubscriptionPlan extends Document {
  planId: string;
  name: string;
  price: number;
  interval: number;
  productLimit: number;
  period: SubscriptionPlanPeriods;
}

const SubscriptionPlanSchema: Schema = new Schema({
  planId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  interval: { type: Number, required: true },
  productLimit: { type: Number, required: true },
  period: SubscriptionPlanPeriods,
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);
