// src/controllers/AdminShopController.ts

import { Request, Response } from 'express';
import Shop from '../../../infrastructure/database/models/ShopSchema';
import Products from '../../../infrastructure/database/models/ProductsSchema';

class AdminShopController {
  // Get all shops with pagination and sort by length of products array
  async getShops(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const searchQuery = req.query.search
        ? {
            name: { $regex: req.query.search as string, $options: 'i' }, // Case-insensitive search
          }
        : {};

      const totalShops = await Shop.countDocuments(searchQuery); // Count shops matching the search query

      // Aggregation to sort by the length of products array and filter based on the search query
      const shops = await Shop.aggregate([
        {
          $match: searchQuery, // Apply the search filter
        },
        {
          $addFields: {
            productsCount: { $size: { $ifNull: ['$products', []] } }, // Count the number of products
          },
        },
        {
          $sort: { productsCount: -1 }, // Sort by productsCount in descending order
        },
        {
          $skip: skip, // Skip for pagination
        },
        {
          $limit: limit, // Limit the number of results for pagination
        },
        {
          $project: {
            productsCount: 0, // Exclude productsCount from the final result
          },
        },
      ]);

      return res.json({ data: shops, total: totalShops, page, limit });
    } catch (error) {
      console.error('Error fetching shops:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  // Get shop details by ID
  async getShopById(req: Request, res: Response) {
    try {
      const { storeId } = req.query;
      const shop = await Shop.findById(storeId);

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      return res.json(shop);
    } catch (error) {
      console.error('Error fetching shop by ID:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  // Get products of a specific shop
  async getShopProducts(req: Request, res: Response) {
    try {
      const { storeId } = req.query;

      // Validate storeId
      if (!storeId) {
        return res.status(400).json({ message: 'Store ID is required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Find the shop by storeId
      const shop = await Shop.findById(storeId).populate('products');

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Assuming products are stored in shop.products as an array of ObjectId
      const productIds = shop.products || [];

      // Fetch products based on the populated shop and apply pagination
      const products = await Products.find({ _id: { $in: productIds } })
        .skip(skip)
        .limit(limit);

      // Get total count of products
      const totalProducts = productIds.length;

      return res.json({ products, total: totalProducts });
    } catch (error) {
      console.error('Error fetching shop products:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default new AdminShopController();
