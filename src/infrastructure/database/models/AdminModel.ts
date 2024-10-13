import mongoose, { Schema, Document } from 'mongoose';
import { IAdmin } from '../../../domain/entities/IAdmin';

const AdminSchema: Schema = new Schema({
  authMethods: [
    {
      lastUsed: { type: String },
      otpSecret: { type: String },
      passwordHash: { type: String },
      provider: { type: String, enum: ['credential', 'google', 'otp'] },
      providerId: { type: String },
    },
  ],
  role: {
    type: String,
    required: true,
    enum: ['superadmin', 'admin', 'manager'],
  },
  profile: {
    address: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      state: { type: String, required: true },
      street: { type: String, required: true },
    },
    contactNumber: { type: String, required: true },
    name: { type: String, required: true },
  },
  isActive: { type: Boolean, required: true },
  permissions: {
    type: String,
    enum: [
      'manage_products',
      'view_orders',
      'manage_users',
      'manage_returns',
      'manage_coupons',
    ],
  },
  lastLogin: { type: Date },
  email: { type: String, required: true, unique: true },
  fcmToken: { type: String },
});

type IAdminModel = IAdmin & Document;

const Admin = mongoose.model<IAdminModel>('Admin', AdminSchema);

export default Admin;
