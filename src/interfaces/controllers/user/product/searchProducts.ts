import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';

export const searchProducts = async (req: Request, res: Response) => {
  const { q, sortBy, limit = '50', page = '1', minPrice, maxPrice } = req.query;

  try {
    const query: any = {};

    // Use regex for partial matching
    if (q) {
      // TODO:using regex will reduce performance, consider using fuzzy search instead ( available in Atlas ).
      query.name = { $regex: new RegExp(q as string, 'i') };
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

    const limitNumber = parseInt(limit as string, 10);
    const pageNumber = parseInt(page as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const products = await StoreProducts.find(query)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNumber);

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
