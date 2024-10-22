import mongoose, { Schema, Document } from 'mongoose';
import ShopOwner from './ShopOwnerModel';
import { SubscriptionPlan } from './SubscriptionPlanModel';

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

VendorSubscriptionSchema.post('updateOne', async function () {
  const vendorSubscriptionId = this.getFilter()['_id']; // Get the subscription ID from the filter
  const subscription =
    await VendorSubscriptionModel.findById(vendorSubscriptionId);

  if (!subscription) return; // If no subscription found, exit

  const vendorId = subscription.vendorId;

  try {
    const update = this.getUpdate().$set;
    console.log(update);

    // Check the status of the subscription
    if (update.status === SubscriptionStatus.ACTIVE) {
      // Fetch the plan data (you may need to adjust this part based on how you store your plans)
      const planData = await SubscriptionPlan.findOne({
        planId: subscription.planId,
      }); // Assuming there's a Plan model
      const totalProductsAllowed = planData?.productLimit || 10; // Default to 10 if not specified

      // Update the totalProductsAllowed in ShopOwner
      const result = await ShopOwner.findOneAndUpdate(
        { _id: vendorId }, // Assuming vendorId is also the ShopOwner ID
        { totalProductsAllowed: totalProductsAllowed },
        { new: true }
      );

      console.log(result);
    } else {
      // If the status is any other value, set totalProductsAllowed to 10
      const result = await ShopOwner.findOneAndUpdate(
        { _id: vendorId },
        { totalProductsAllowed: 10 },
        { new: true }
      );

      console.log(result);
    }
  } catch (error) {
    console.error('Error updating totalProductsAllowed:', error);
  }
});

const VendorSubscriptionModel = mongoose.model<IVendorSubscription>(
  'VendorSubscription',
  VendorSubscriptionSchema
);

/* async function testUpdateVendorSubscriptionStatus(
  vendorSubscriptionId: mongoose.Types.ObjectId,
  newStatus: SubscriptionStatus
) {
  try {
    // console.log(await VendorSubscriptionModel.findById('671784777daf4c1609315d9c'));

    // Update the subscription status
    const result = await VendorSubscriptionModel.updateOne(
      { _id: vendorSubscriptionId },
      { $set: { status: newStatus } }
    );

    // console.log('Update result:', result);

    // Fetch the updated ShopOwner to check totalProductsAllowed
    const vendorId = (
      await VendorSubscriptionModel.findById(vendorSubscriptionId)
    )?.vendorId; // Get the vendorId from the subscription
    const updatedShopOwner = await ShopOwner.findById(vendorId);

    console.log('Updated ShopOwner:', updatedShopOwner);
  } catch (error) {
    console.error('Error updating vendor subscription status:', error);
  }
}

testUpdateVendorSubscriptionStatus(
  '671784777daf4c1609315d9c',
  SubscriptionStatus.ACTIVE
); */

export default VendorSubscriptionModel;
