import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

export const searchProducts = async (req: Request, res: Response) => {
  const { q, sortBy, limit = '50', page = '1' } = req.query;

  try {
    const query: any = {};

    // Text-based search
    if (q) {
      query.$text = { $search: q };
    }

    // Determine the sort criteria
    let sortCriteria: any = { score: { $meta: 'textScore' } }; // Default sort by text score

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

    // Fetch products with pagination and sorting
    const products = await Products.find(query, {
      score: { $meta: 'textScore' }, // Include text score in the results
    })
      .sort(sortCriteria)
      .skip(skip) // Skip the appropriate number of results
      .limit(limitNumber); // Limit the number of results

    // Get total count for pagination
    const totalCount = await Products.countDocuments(query);

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
