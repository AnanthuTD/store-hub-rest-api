export interface IUser {
  id: string;
  username?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  emailVerified?: boolean;

  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    dateOfBirth?: Date;
  };
  createdAt?: Date;
  lastLogin?: Date;
  role?: string;
  status?: string;

  account?: {
    type: string;
    provider: string;
    providerAccountId: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: Date;
    tokenType?: string;
    scope?: string;
    idToken?: string;
    sessionState?: string;
  }[];

  verificationToken?: {
    token: string;
    expires: Date;
    identified: string;
  };
}
