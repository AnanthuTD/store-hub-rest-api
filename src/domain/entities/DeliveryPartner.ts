export interface IDeliveryPartner {
  _id?: string;
  isVerified: boolean;
  firstName: string;
  lastName: string;
  dob: Date;
  city: string;
  address: string;
  avatar: string;
  bloodGroup: string;
  email?: string;
  phone?: string;

  availability: {
    idAvailable: boolean;
    lastUpdate: string;
  };
  createdAt: string;
  updatedAt: string;
  ratings: {
    averageRating: number;
    reviewCount: number;
  };

  documents: {
    aadhar: {
      frontImage: string;
      backImage: string;
      isVerified: boolean;
    };
    drivingLicense: {
      frontImage: string;
      backImage: string;
      isVerified: boolean;
    };
    pan: {
      frontImage: string;
      backImage: string;
      isVerified: boolean;
    };
    emergencyContact: {
      relationship: string;
      phone: string;
      name: string;
      isVerified: boolean;
    };
    vehicle: {
      vehicleType: string;
      vehicleModel: string;
      registrationNumber: string;
      registrationYear: string;
      isVerified: boolean;
    };
    bankAccountDetails: {
      accountHolderName: string;
      ifscCode: string;
      accountNumber: string;
      bankName: string;
      isVerified: boolean;
    };
  };
  status?: string;
  message?: string;
}
