import { Request, Response } from 'express';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';

export const getProductsByCategoryOrSearch = async (
  req: Request,
  res: Response
) => {
  const { sortBy, limit = '16', page = '1', minPrice, maxPrice } = req.query;
  const { categoryId } = req.params;

  console.log(categoryId);

  try {
    const query: any = {};

    // If categoryId is present, prioritize category-based filtering
    if (categoryId) {
      query['category._id'] = categoryId;
    }

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

    // Determine the sort criteria based on the input
    let sortCriteria: any = { score: { $meta: 'textScore' } };

    if (sortBy === 'popularity') {
      sortCriteria = { popularity: -1 };
    } else if (sortBy === 'price_asc') {
      sortCriteria = { 'variants.0.price': 1 };
    } else if (sortBy === 'price_desc') {
      sortCriteria = { 'variants.0.price': -1 };
    } else if (sortBy === 'rating') {
      sortCriteria = { rating: -1 };
    }

    // Convert limit and page to numbers
    const limitNumber = parseInt(limit as string, 10);
    const pageNumber = parseInt(page as string, 10);

    // Calculate the number of documents to skip
    const skip = (pageNumber - 1) * limitNumber;

    const products = await StoreProducts.find(query)
      .sort(sortCriteria)
      .skip(skip) // Skip the appropriate number of results
      .limit(limitNumber); // Limit to the specified number of results

    // Get total count for pagination
    const totalCount = await StoreProducts.countDocuments(query);

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
