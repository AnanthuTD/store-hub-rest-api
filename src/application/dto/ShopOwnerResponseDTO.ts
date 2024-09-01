import { IShopOwner } from '../../domain/entities/IShopOwner';

export interface ShopOwnerResponseDTO {
  _id: string;
  documents: {
    imageUrl: string[] | null;
    type: string | null;
  }[];
  bankDetails: {
    accountHolderName: string | null;
    accountNumber: string | null;
    bankName: string | null;
    ifscCode: string | null;
  };
  authMethods: {
    provider: 'credential' | 'google' | 'otp';
  }[];
  createdAt: string | null;
  email: string | null;
  phone: string | null;
  updatedAt: string | null;
  profile: {
    address: {
      city: string | null;
      country: string | null;
      postalCode: string | null;
      state: string | null;
      street: string | null;
    };
    firstName: string;
    lastName: string;
  } | null;
}

export function toShopOwnerSignInResponseDTO(
  shopOwner: IShopOwner
): ShopOwnerResponseDTO {
  return {
    _id: shopOwner._id,
    documents: shopOwner.documents.map((doc) => ({
      imageUrl: doc.imageUrl,
      type: doc.type,
    })),
    bankDetails: {
      accountHolderName: shopOwner.bankDetails.accountHolderName,
      accountNumber: shopOwner.bankDetails.accountNumber,
      bankName: shopOwner.bankDetails.bankName,
      ifscCode: shopOwner.bankDetails.ifscCode,
    },
    authMethods: shopOwner.authMethods.map((auth) => ({
      provider: auth.provider,
    })),
    createdAt: shopOwner.createdAt,
    email: shopOwner.email,
    phone: shopOwner.phone,
    updatedAt: shopOwner.updatedAt,
    profile: shopOwner.profile
      ? {
          address: {
            city: shopOwner.profile.address.city,
            country: shopOwner.profile.address.country,
            postalCode: shopOwner.profile.address.postalCode,
            state: shopOwner.profile.address.state,
            street: shopOwner.profile.address.street,
          },
          firstName: shopOwner.profile.firstName,
          lastName: shopOwner.profile.lastName,
        }
      : null,
  };
}
