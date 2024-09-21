import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

export const searchProducts = async (req: Request, res: Response) => {
  const { q, category, sortBy } = req.query;

  try {
    const query: any = {};

    // Text-based search
    if (q) {
      query.$text = { $search: q };
    }

    // Optional filters
    if (category) {
      query.category = category;
    }

    // Determine the sort criteria
    let sortCriteria: any = { score: { $meta: 'textScore' } }; // Default sort by text score

    if (sortBy === 'popularity') {
      sortCriteria = { popularity: -1 };
    } else if (sortBy === 'price_asc') {
      sortCriteria = { price: 1 };
    } else if (sortBy === 'price_desc') {
      sortCriteria = { price: -1 };
    } else if (sortBy === 'rating') {
      sortCriteria = { rating: -1 };
    }

    const products = await Products.find(query, {
      score: { $meta: 'textScore' },
    })
      .sort(sortCriteria) // Apply the sort criteria
      .limit(50); // Limit the number of results

    res.status(200).json(products);
  } catch (error) {
    console.error('Error during product search:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
};
