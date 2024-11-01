import mongoose, { Schema, Document } from 'mongoose';

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

export interface IVendorSubscription extends Document {
  vendorId: mongoose.Types.ObjectId;
  razorpaySubscriptionId: string;
  planId: string;
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
  currentEnd: Date;
  endedAt: Date;
  currentStart: Date;
  chargeAt: Date;
  cancelledAt: Date;
}

const VendorSubscriptionSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, required: true, ref: 'Vendor' },
    razorpaySubscriptionId: { type: String, required: true },
    planId: { type: String, required: true },
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
    currentEnd: { type: Date },
    endedAt: { type: Date },
    currentStart: { type: Date },
    chargeAt: { type: Date },
    cancelledAt: { type: Date },
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

/* VendorSubscriptionSchema.post('findOneAndUpdate', async function () {
  const vendorSubscriptionId = this.getFilter()['_id'];
  const subscription =
    await VendorSubscriptionModel.findById(vendorSubscriptionId);

  if (!subscription) return;

  const vendorId = subscription.vendorId;

  try {
    const update = this.getUpdate().$set;

    if (update.status === SubscriptionStatus.ACTIVE) {
      const planData = await SubscriptionPlan.findOne({
        planId: subscription.planId,
      });
      const totalProductsAllowed = planData?.productLimit || 10; // Default to 10 if not specified

      console.log('VendorId: ', vendorId, "\tActive subscription: ", subscription._id )

      // Update the totalProductsAllowed in ShopOwner
      const result = await ShopOwner.findOneAndUpdate(
        { _id: vendorId },
        {
          totalProductsAllowed: totalProductsAllowed,
          activeSubscriptionId: subscription._id,
        },
        { new: true }
      );

      console.log(result);
    } else {
      // If the status is any other value, set totalProductsAllowed to 10
      const result = await ShopOwner.findOneAndUpdate(
        { _id: vendorId },
        { totalProductsAllowed: 10, activeSubscriptionId: null },
        { new: true }
      );

      console.log(result);
    }
  } catch (error) {
    console.error('Error updating totalProductsAllowed:', error);
  }
}); */

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
