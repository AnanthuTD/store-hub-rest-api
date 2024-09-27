// models/Payment.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface Payment extends Document {
  orderId: mongoose.Schema.Types.ObjectId;
  paymentId?: string; // Optional for COD
  amount: number;
  currency: string;
  status: 'Success' | 'Failure' | 'Pending';
  paymentDate: Date;
  paymentMethod: 'Razorpay' | 'COD';
}

const PaymentSchema: Schema = new Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    paymentId: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['Success', 'Failure', 'Pending'],
      default: 'Pending',
    },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Razorpay', 'COD'], required: true },
  },
  { timestamps: true }
);

const Payment = mongoose.model<Payment>('Payment', PaymentSchema);
export default Payment;
