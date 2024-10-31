import { IShopOwner } from '../../../domain/entities/IShopOwner';
import ShopOwner from '../../../infrastructure/database/models/ShopOwnerModel';

/**
 * Response structure for the canAddNewProduct function.
 */
interface CanAddProductResponse {
  isVerified: boolean;
  message: string;
}

/**
 * Checks if a vendor can add a new product based on their subscription plan and product limit.
 * @param vendorId - The ID of the vendor.
 * @returns A promise that resolves with an object containing the status and message.
 */
export async function checkIsVerified(
  vendorId: string
): Promise<CanAddProductResponse> {
  try {
    const shopOwner: IShopOwner | null = await ShopOwner.findById(vendorId);

    if (!shopOwner) {
      return {
        isVerified: false,
        message: 'Vendor not found. Please contact support.',
      };
    }

    if (!shopOwner.isVerified) {
      return {
        isVerified: false,
        message: 'Vendor is not verified. Please verify your account.',
      };
    }

    return {
      isVerified: true,
      message: 'You are verified.',
    };
  } catch (error) {
    console.error('Error checking product addition:', error);
    return {
      isVerified: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
