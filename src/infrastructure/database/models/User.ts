import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../../../domain/entities/User';

// @ts-expect-error just for now
export interface IUserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, unique: true },
    password: { type: String },
    mobileNumber: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    profile: {
      type: new Schema({
        firstName: { type: String, required: true },
        lastName: { type: String },
        avatar: { type: String },
        dateOfBirth: { type: Date },
      }),
      required: false,
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    role: { type: String },
    status: { type: String },
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
