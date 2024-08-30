import { z } from 'zod';

export const deliveryPartnerPersonalSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  dob: z.date(),
  city: z.string(),
  address: z.string(),
  avatar: z.string(),
  bloodGroup: z.string(),
  documents: z.object({
    aadhar: z.object({
      frontImage: z.string(),
      backImage: z.string(),
    }),
    drivingLicense: z.object({
      frontImage: z.string(),
      backImage: z.string(),
    }),
    pan: z.object({
      frontImage: z.string(),
      backImage: z.string(),
    }),
    vehicle: z.object({
      vehicleType: z.string(),
      vehicleModel: z.string(),
      registrationNumber: z.string(),
      registrationYear: z.string(),
    }),
    emergencyContact: z.object({
      relationship: z.string(),
      phone: z.string(),
      name: z.string(),
    }),
    bankAccountDetails: z.object({
      accountHolderName: z.string(),
      ifscCode: z.string(),
      accountNumber: z.string(),
      bankName: z.string(),
    }),
  }),
});
