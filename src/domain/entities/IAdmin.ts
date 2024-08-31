export interface IAdmin {
  _id: string;
  authMethods: {
    lastUsed: string | null;
    otpSecret: string | null;
    passwordHash: string | null;
    provider: string | null;
    providerId: string | null;
  }[];
  role: string;
  profile: {
    address: {
      city: string;
      country: string;
      postalCode: string;
      state: string;
      street: string;
    } | null;
    contactNumber: string;
    name: string;
  } | null;
  isActive: boolean;
  permissions: string | null;
  lastLogin: Date | null;
  email: string;
}
