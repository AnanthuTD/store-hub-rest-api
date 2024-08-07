import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../../domain/entities/User';

// @ts-expect-error just for now
export interface IUserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      avatar: { type: String },
      dateOfBirth: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    role: { type: String },
    status: { type: String },
    account: [
      {
        type: {
          type: String,
          required: true,
        },
        provider: {
          type: String,
          required: true,
        },
        providerAccountId: {
          type: String,
          required: true,
        },
        refreshToken: {
          type: String,
        },
        accessToken: {
          type: String,
        },
        expiresAt: {
          type: Date,
        },
        tokenType: {
          type: String,
        },
        scope: {
          type: String,
        },
        idToken: {
          type: String,
        },
        sessionState: {
          type: String,
        },
      },
    ],
    verificationToken: {
      token: {
        type: String,
      },
      expires: {
        type: Date,
      },
      identified: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
