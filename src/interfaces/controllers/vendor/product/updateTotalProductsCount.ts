import mongoose, { Document } from 'mongoose';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import Shop from '../../../../infrastructure/database/models/ShopSchema';
import ShopOwner from '../../../../infrastructure/database/models/ShopOwnerModel';

interface IStoreProduct extends Document {
  storeId: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'archived';
}

// Function to update total products based on product status
export default async function updateTotalProducts(
  storeProduct: IStoreProduct
): Promise<void> {
  try {
    const store = await Shop.findById(storeProduct.storeId);
    if (!store) {
      console.error('Store not found for storeId:', storeProduct.storeId);
      return;
    }

    const shopOwnerId = store.ownerId;

    // Fetch the original product status from the database
    const originalProduct = await StoreProducts.findById(storeProduct._id);
    if (!originalProduct) return;

    const previousStatus = originalProduct.status;
    const newStatus = storeProduct.status;

    // Check if the status changed between 'active' and 'inactive'
    if (previousStatus !== newStatus) {
      const increment = newStatus === 'active' ? 1 : -1;

      await ShopOwner.findOneAndUpdate(
        { _id: shopOwnerId },
        { $inc: { totalProductsAdded: increment } },
        { new: true }
      );

      console.log(`ShopOwner updated for storeId ${storeProduct.storeId}`);
    }
  } catch (error) {
    console.error('Error updating totalProductsAdded:', error);
  }
}
