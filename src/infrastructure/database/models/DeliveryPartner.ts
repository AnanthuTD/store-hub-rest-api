import mongoose, { Schema } from 'mongoose';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';

const DeliveryPartnerSchema: Schema = new Schema(
  {
    isVerified: { type: Boolean, default: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    avatar: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    email: { type: String, default: null, unique: true },
    phone: { type: String, default: null, unique: true },
    availability: {
      isAvailable: { type: Boolean, default: false },
      lastUpdate: { type: Date, default: Date.now },
    },
    ratings: {
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
    documents: {
      aadhar: {
        frontImage: { type: String, required: true },
        backImage: { type: String, required: true },
      },
      drivingLicense: {
        frontImage: { type: String, required: true },
        backImage: { type: String, required: true },
      },
      pan: {
        frontImage: { type: String, required: true },
        backImage: { type: String, required: true },
      },
      vehicle: {
        vehicleType: { type: String, required: true },
        vehicleModel: { type: String, required: true },
        registrationNumber: { type: String, required: true },
        registrationYear: { type: String, required: true },
      },
      emergencyContact: {
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        name: { type: String, required: true },
      },
      bankAccountDetails: {
        accountHolderName: { type: String, required: true },
        ifscCode: { type: String, required: true },
        accountNumber: { type: String, required: true },
        bankName: { type: String, required: true },
      },
    },
  },
  { timestamps: true }
);

DeliveryPartnerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const DeliveryPartner = mongoose.model<IDeliveryPartner>(
  'DeliveryPartner',
  DeliveryPartnerSchema
);

export default DeliveryPartner;
