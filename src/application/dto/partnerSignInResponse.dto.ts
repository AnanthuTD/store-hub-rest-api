import { IDeliveryPartner } from '../../domain/entities/DeliveryPartner';

export interface PartnerSignInResponseDTO {
  _id: string;
  role: string;
  profile: {
    address?: {
      city: string;
      country: string;
      postalCode: string;
      state: string;
      street: string;
    };
    contactNumber: string;
    name: string;
  } | null;
  isActive: boolean;
  permissions: string | null;
  lastLogin: Date | null;
  email: string;
}

export function toAdminSignInResponseDTO(
  partner: IDeliveryPartner
): PartnerSignInResponseDTO {
  return {
    _id: partner._id,
    email: partner.email,
    profile: partner.profile,
    isActive: partner.isActive,
    permissions: partner.permissions,
    lastLogin: partner.lastLogin,
  };
}
