import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionType {
  BASIC = 'Basic',
  PREMIUM = 'Premium',
  ENTERPRISE = 'Enterprise',
}

export enum SubscriptionStatus {
  CREATED = 'created',
  AUTHENTICATED = 'authenticated',
  ACTIVE = 'active',
  PENDING = 'pending',
  HALTED = 'halted',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  CHARGED = 'charged',
}

interface IVendorSubscription extends Document {
  vendorId: mongoose.Types.ObjectId;
  razorpaySubscriptionId: string;
  planId: string;
  subscriptionType: SubscriptionType;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  remainingCount: number;
  paidCount: number;
  totalCount: number;
  amount: number;
  shortUrl: string;
  notes?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSubscriptionSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, required: true, ref: 'Vendor' },
    razorpaySubscriptionId: { type: String, required: true },
    planId: { type: String, required: true },
    subscriptionType: {
      type: String,
      enum: Object.values(SubscriptionType),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.CREATED,
    },
    remainingCount: { type: Number, required: true },
    paidCount: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    amount: { type: Number, required: true },
    shortUrl: { type: String, required: true },
    notes: { type: Map, of: String },
  },
  { timestamps: true }
);

VendorSubscriptionSchema.index(
  { vendorId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: SubscriptionStatus.ACTIVE },
  }
);

const VendorSubscriptionModel = mongoose.model<IVendorSubscription>(
  'VendorSubscription',
  VendorSubscriptionSchema
);

export default VendorSubscriptionModel;
