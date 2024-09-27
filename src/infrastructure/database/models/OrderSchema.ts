import mongoose, { Document, Schema } from 'mongoose';

interface Item {
  productId: mongoose.Schema.Types.ObjectId;
  variantId: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  items: Item[];
  totalAmount: number;
  orderDate: Date;
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  paymentId: string | null;
  paymentMethod: 'Razorpay' | 'COD';
  shippingAddress: string;
}

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'StoreProduct',
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    paymentId: { type: String, default: null },
    paymentMethod: { type: String, enum: ['Razorpay', 'COD'], required: true },
    shippingAddress: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
