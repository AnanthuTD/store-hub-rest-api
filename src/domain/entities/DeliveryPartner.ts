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
    };
    drivingLicense: {
      frontImage: string;
      backImage: string;
    };
    pan: {
      frontImage: string;
      backImage: string;
    };
    emergencyContact: {
      relationship: string;
      phone: string;
      name: string;
    };
    vehicle: {
      vehicleType: string;
      vehicleModel: string;
      registrationNumber: string;
      registrationYear: string;
    };
    bankAccountDetails: {
      accountHolderName: string;
      ifscCode: string;
      accountNumber: string;
      bankName: string;
    };
  };
}
