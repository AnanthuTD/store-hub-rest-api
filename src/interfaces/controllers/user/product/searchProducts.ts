import { Request, Response } from 'express';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import ShopOwner from '../../../../infrastructure/database/models/ShopOwnerModel'; // Import your ShopOwner model
import Shop from '../../../../infrastructure/database/models/ShopSchema';

export const searchProducts = async (req: Request, res: Response) => {
  const { q, sortBy, limit = '50', page = '1', minPrice, maxPrice } = req.query;

  try {
    const query: any = {};

    // Use regex for partial matching
    if (q) {
      // TODO: Using regex will reduce performance, consider using fuzzy search instead (available in Atlas).
      query.name = { $regex: new RegExp(q as string, 'i') };
    }

    // Filter by price range
    if (!Number.isNaN(minPrice)) {
      query['variants.0.price'] = {
        ...query['variants.0.price'],
        $gte: minPrice,
      };
    }
    if (!Number.isNaN(maxPrice)) {
      query['variants.0.price'] = {
        ...query['variants.0.price'],
        $lte: maxPrice,
      };
    }

    // Fetch store IDs with active subscriptions
    const activeVendors = await ShopOwner.find(
      { activeSubscriptionId: { $ne: null } }, // Only fetch stores with an active subscription
      { _id: 1 } // Only return the store IDs
    ).lean();

    const activeVendorIds = activeVendors.map((store) => store._id);

    const activeStores = await Shop.find({ ownerId: { $in: activeVendorIds } });

    const activeStoreIds = activeStores.map((store) => store._id);

    // Add storeId filter to the query
    query.storeId = { $in: activeStoreIds };

    // Set sorting criteria
    let sortCriteria: any = { score: { $meta: 'textScore' } };

    if (sortBy === 'popularity') {
      sortCriteria = { popularity: -1 };
    } else if (sortBy === 'price_asc') {
      sortCriteria = { 'variants.0.price': 1 };
    } else if (sortBy === 'price_desc') {
      sortCriteria = { 'variants.0.price': -1 };
    } else if (sortBy === 'rating') {
      sortCriteria = { 'ratingSummary.averageRating': -1 };
    }

    const limitNumber = parseInt(limit as string, 10);
    const pageNumber = parseInt(page as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Find products matching the query and sort criteria
    const products = await StoreProducts.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNumber);

    // Count total documents matching the query
    const totalCount = await StoreProducts.countDocuments(query);

    res.status(200).json({
      products,
      totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / limitNumber),
    });
  } catch (error) {
    console.error('Error during product search:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
};
