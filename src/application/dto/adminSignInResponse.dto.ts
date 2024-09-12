import { IAdmin } from '../../domain/entities/IAdmin';

export interface AdminSignInResponseDTO {
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
  admin: IAdmin
): AdminSignInResponseDTO {
  return {
    _id: admin._id,
    email: admin.email,
    role: admin.role,
    profile: admin.profile,
    isActive: admin.isActive,
    permissions: admin.permissions,
    lastLogin: admin.lastLogin,
  };
}
