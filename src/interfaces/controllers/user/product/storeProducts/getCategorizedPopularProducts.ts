import { Request, Response } from 'express';
import Category from '../../../../../infrastructure/database/models/CategoryModel';
import StoreProducts from '../../../../../infrastructure/database/models/StoreProducts';

/**
 * Controller to fetch 10 most popular products from 3 random categories
 * from StoreProducts
 *
 */
export const getCategorizedPopularProducts = async (
  req: Request,
  res: Response
) => {
  try {
    // Step 1: Select 3 random categories
    const randomCategories = await Category.aggregate([
      { $match: { status: 'active' } }, // Only pick active categories
      { $sample: { size: 3 } }, // Randomly select 3 categories
    ]);

    if (randomCategories.length === 0) {
      return res.status(404).json({ message: 'No categories found' });
    }

    // Step 2: For each selected category, fetch 10 most popular products
    const popularProductsByCategory = await Promise.all(
      randomCategories.map(async (category) => {
        const products = await StoreProducts.find({
          'category._id': category._id,
        })
          .sort({ popularity: -1 }) // Sort by popularity in descending order
          .limit(10); // Limit to top 10 products

        return {
          category: category.name,
          products,
        };
      })
    );

    // Step 3: Return the products
    return res.json(popularProductsByCategory);
  } catch (error) {
    console.error('Error fetching popular products:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
