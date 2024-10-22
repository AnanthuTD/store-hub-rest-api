import mongoose, { Schema, Document } from 'mongoose';
import { IShopOwner } from '../../../domain/entities/IShopOwner';

const ShopOwnerSchema: Schema = new Schema(
  {
    phone: { type: String, required: false },
    email: { type: String, required: false },
    isVerified: { type: Boolean, required: false, default: false },
    documents: [
      {
        imageUrl: [{ type: String, required: false }],
        type: {
          type: String,
          enum: ['aadhar', 'pan', 'driving-license'],
          required: false,
        },
        status: { type: String, required: false },
      },
    ],
    bankDetails: {
      accountHolderName: { type: String, required: false },
      accountNumber: { type: String, required: false },
      bankName: { type: String, required: false },
      ifscCode: { type: String, required: false },
    },
    authMethods: [
      {
        passwordHash: { type: String, required: false },
        provider: {
          type: String,
          enum: ['credential', 'google', 'otp'],
          required: false,
        },
      },
    ],
    emailVerified: { type: Boolean, required: false },
    createdAt: { type: String, required: false },
    updatedAt: { type: String, required: false },
    profile: {
      address: {
        city: { type: String, required: false },
        country: { type: String, required: false },
        postalCode: { type: String, required: false },
        state: { type: String, required: false },
        street: { type: String, required: false },
      },
      firstName: { type: String, required: false },
      lastName: { type: String, required: false },
      avatar: { type: String, required: false },
    },
    message: { type: String, required: false },
    fcmToken: { type: String },
    walletBalance: { type: Number, default: 0 },
    totalProductsAllowed: { type: Number, required: false, default: 0 },
    totalProductsAdded: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

ShopOwnerSchema.virtual('remainingProducts').get(function () {
  return this.totalProductsAllowed - this.totalProductsAdded;
});

ShopOwnerSchema.set('toJSON', { virtuals: true });
ShopOwnerSchema.set('toObject', { virtuals: true });

type IShopOwnerType = IShopOwner & Document;

const ShopOwner = mongoose.model<IShopOwnerType>('ShopOwner', ShopOwnerSchema);

export default ShopOwner;
