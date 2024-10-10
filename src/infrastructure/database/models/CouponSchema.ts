import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expirationDate: Date;
  usageLimit: number;
  perUserLimit: number;
  usedBy: {
    userId: mongoose.Schema.Types.ObjectId;
    usedCount: number;
  }[];
}

const CouponSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  expirationDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      usedCount: { type: Number, default: 0 },
    },
  ],
});

const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
