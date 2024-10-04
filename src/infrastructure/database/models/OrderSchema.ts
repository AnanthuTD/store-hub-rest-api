import mongoose, { Document, Schema } from 'mongoose';

interface Item {
  productId: mongoose.Schema.Types.ObjectId;
  variantId: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number;
  storeId: mongoose.Schema.Types.ObjectId;
  productName: string;
  storeName: string;
  storeStatus: 'Available' | 'Failed'; // Status for the store if the product is available
  returnStatus: 'Not Requested' | 'Requested' | 'Completed'; // Status for return requests
}

export interface IOrder extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  items: Item[];
  totalAmount: number;
  orderDate: Date;
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  paymentId: string | null;
  paymentMethod: 'Razorpay' | 'COD';
  deliveryPartnerId: mongoose.Schema.Types.ObjectId | null; // Info about the assigned delivery partner
  deliveryPartnerName: string | null; // Name of the delivery partner for tracking
  deliveryStatus: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered'; // Tracking the delivery process
  shippingAddress?: string; // Optional field as you mentioned users select their location on the map
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
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
        productName: { type: String, required: true },
        // storeName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        storeId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Shop',
        },
        storeStatus: {
          type: String,
          enum: ['Available', 'Failed'],
          default: 'Available',
        },
        returnStatus: {
          type: String,
          enum: ['Not Requested', 'Requested', 'Completed'],
          default: 'Not Requested',
        },
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

    // Delivery partner information
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      default: null,
    },
    deliveryPartnerName: { type: String, default: null },
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Transit', 'Delivered'],
      default: 'Pending',
    },

    shippingAddress: { type: String },
    deliveryLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
