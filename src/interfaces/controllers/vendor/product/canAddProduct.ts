import { IShopOwner } from '../../../../domain/entities/IShopOwner';
import ShopOwner from '../../../../infrastructure/database/models/ShopOwnerModel';

/**
 * Response structure for the canAddNewProduct function.
 */
interface CanAddProductResponse {
  canAdd: boolean;
  message: string;
}

/**
 * Checks if a vendor can add a new product based on their subscription plan and product limit.
 * @param vendorId - The ID of the vendor.
 * @returns A promise that resolves with an object containing the status and message.
 */
export async function canAddNewProduct(
  vendorId: string
): Promise<CanAddProductResponse> {
  try {
    const shopOwner: IShopOwner | null = await ShopOwner.findById(vendorId);

    if (!shopOwner) {
      return {
        canAdd: false,
        message: 'Vendor not found. Please contact support.',
      };
    }

    if (!shopOwner.isVerified) {
      return {
        canAdd: false,
        message:
          'Vendor is not verified. Please verify your account to add products.',
      };
    }

    if (!shopOwner.stores.length) {
      return {
        canAdd: false,
        message: 'Create a new store to start adding products',
      };
    }

    const { totalProductsAllowed, totalProductsAdded, activeSubscriptionId } =
      shopOwner;

    // Check if there's an active subscription
    if (!activeSubscriptionId) {
      return {
        canAdd: false,
        message:
          'No active subscription. Please subscribe to a plan to add products.',
      };
    }

    // Check if the product limit has been reached
    if (totalProductsAdded >= totalProductsAllowed) {
      const excess = totalProductsAdded - totalProductsAllowed + 1;
      return {
        canAdd: false,
        message: `Product limit reached. Please disable ${excess} product(s) or upgrade your plan to add new products.`,
      };
    }

    // If all checks pass, allow product addition
    return {
      canAdd: true,
      message: 'You can add a new product.',
    };
  } catch (error) {
    console.error('Error checking product addition eligibility:', error);
    return {
      canAdd: false,
      message:
        'An error occurred while checking product eligibility. Please try again later.',
    };
  }
}
