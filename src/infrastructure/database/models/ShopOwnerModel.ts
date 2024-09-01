import mongoose, { Schema, Document } from 'mongoose';
import { IShopOwner } from '../../../domain/entities/IShopOwner';

const ShopOwnerSchema: Schema = new Schema({
  phone: { type: String },
  email: { type: String },
  documents: [
    {
      imageUrl: [{ type: String }],
      type: { type: String, enum: ['aadhar', 'pan', 'driving-license'] },
    },
  ],
  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
  },
  authMethods: [
    {
      passwordHash: { type: String },
      provider: { type: String, enum: ['credential', 'google', 'otp'] },
    },
  ],
  createdAt: { type: String },
  email: { type: String },
  phone: { type: String },
  updatedAt: { type: String },
  profile: {
    address: {
      city: { type: String },
      country: { type: String },
      postalCode: { type: String },
      state: { type: String },
      street: { type: String },
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
});

type IShopOwnerType = IShopOwner & Document;

const ShopOwner = mongoose.model<IShopOwnerType>('ShopOwner', ShopOwnerSchema);

export default ShopOwner;
