import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  planId: string;
  name: string;
  price: number;
  duration: number;
  productLimit: number;
}

const SubscriptionPlanSchema: Schema = new Schema({
  planId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true }, // in months
  productLimit: { type: Number, required: true },
});

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  SubscriptionPlanSchema
);
