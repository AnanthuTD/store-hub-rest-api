import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

export const getProductsByCategoryOrSearch = async (
  req: Request,
  res: Response
) => {
  const { sortBy, limit = '16', page = '1' } = req.query;
  const { categoryId } = req.params;

  console.log(categoryId);

  try {
    const query: any = {};

    // If categoryId is present, prioritize category-based filtering
    if (categoryId) {
      query['category._id'] = categoryId;
    }

    // Determine the sort criteria based on the input
    let sortCriteria: any = {}; // Default sort criteria can be set here

    if (sortBy === 'popularity') {
      sortCriteria = { popularity: -1 };
    } else if (sortBy === 'price_asc') {
      sortCriteria = { 'variants.averagePrice': 1 };
    } else if (sortBy === 'price_desc') {
      sortCriteria = { 'variants.averagePrice': -1 };
    } else if (sortBy === 'rating') {
      sortCriteria = { rating: -1 };
    }

    // Convert limit and page to numbers
    const limitNumber = parseInt(limit as string, 10);
    const pageNumber = parseInt(page as string, 10);

    // Calculate the number of documents to skip
    const skip = (pageNumber - 1) * limitNumber;

    const products = await Products.find(query)
      .sort(sortCriteria)
      .skip(skip) // Skip the appropriate number of results
      .limit(limitNumber); // Limit to the specified number of results

    // Get total count for pagination
    const totalCount = await Products.countDocuments(query);

    res.status(200).json({
      products,
      totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / limitNumber),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};
