import mongoose, { Schema } from 'mongoose';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';

const DeliveryPartnerSchema: Schema = new Schema(
  {
    isVerified: { type: Boolean, default: false },
    firstName: { type: String, required: false }, // Optional
    lastName: { type: String, required: false }, // Optional
    dob: { type: Date, required: false }, // Optional
    city: { type: String, required: false }, // Optional
    address: { type: String, required: false }, // Optional
    avatar: { type: String, required: false }, // Optional
    bloodGroup: { type: String, required: false }, // Optional
    email: { type: String, sparse: true, required: false }, // Optional
    phone: { type: String, unique: true, required: false }, // Optional
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
        frontImage: { type: String, required: false }, // Optional
        backImage: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
      drivingLicense: {
        frontImage: { type: String, required: false }, // Optional
        backImage: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
      pan: {
        frontImage: { type: String, required: false }, // Optional
        backImage: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
      vehicle: {
        vehicleType: { type: String, required: false }, // Optional
        vehicleModel: { type: String, required: false }, // Optional
        registrationNumber: { type: String, required: false }, // Optional
        registrationYear: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
      emergencyContact: {
        relationship: { type: String, required: false }, // Optional
        phone: { type: String, required: false }, // Optional
        name: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
      bankAccountDetails: {
        accountHolderName: { type: String, required: false }, // Optional
        ifscCode: { type: String, required: false }, // Optional
        accountNumber: { type: String, required: false }, // Optional
        bankName: { type: String, required: false }, // Optional
        status: { type: String, required: false }, // Optional
      },
    },
    status: { type: String, required: false },
    message: { type: String, required: false },
    fcmToken: { type: String },
    walletBalance: { type: Number, required: false, default: 0 },
  },
  { timestamps: true }
);

// Middleware to set the updatedAt timestamp
DeliveryPartnerSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const DeliveryPartner = mongoose.model<IDeliveryPartner>(
  'DeliveryPartner',
  DeliveryPartnerSchema
);

export default DeliveryPartner;
