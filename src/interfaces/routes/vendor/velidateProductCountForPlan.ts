import ShopOwner from '../../../infrastructure/database/models/ShopOwnerModel';
import { SubscriptionPlan } from '../../../infrastructure/database/models/SubscriptionPlanModel';

/**
 * Validates if the vendor can switch to a new subscription plan.
 * Ensures that totalProductsAdded is within the product limit of the new plan.
 *
 * @param {string} vendorId - ID of the vendor/shop owner.
 * @param {string} newPlanId - ID of the new subscription plan.
 * @throws {Error} If totalProductsAdded exceeds the new plan's product limit.
 */
export async function validateProductCountForPlan(vendorId, newPlanId) {
  try {
    // Fetch the new subscription plan details
    const planData = await SubscriptionPlan.find({ planId: newPlanId });
    if (!planData) {
      throw new Error('Subscription plan not found');
    }

    const totalProductsAllowed = planData.productLimit;

    // Fetch the shop owner/vendor details
    const shopOwner = await ShopOwner.findById(vendorId);
    if (!shopOwner) {
      throw new Error('Shop owner not found');
    }

    // Check if totalProductsAdded exceeds the new plan's product limit
    if (shopOwner.totalProductsAdded > totalProductsAllowed) {
      const excessProducts =
        shopOwner.totalProductsAdded - totalProductsAllowed;
      throw new Error(
        `You have ${shopOwner.totalProductsAdded} products. Please disable ${excessProducts} products before switching to this plan.`
      );
    }

    return true; // Validation successful
  } catch (error) {
    console.error('Error in product count validation:', error);
    throw error; // Re-throw the error to be handled by the route
  }
}
