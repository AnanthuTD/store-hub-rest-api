import { Request, Response } from 'express';
import Products from '../../../infrastructure/database/models/ProductsSchema';

// Search API
export const searchProducts = async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice } = req.query;

  try {
    const query: any = {};

    // Text-based search
    if (q) {
      query.$text = { $search: q }; // MongoDB full-text search
    }

    // Optional filters
    if (category) {
      query.category = category; // Assuming category is stored as a string
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    const products = await Products.find(query).limit(50); // Limit the number of results

    res.status(200).json(products);
  } catch (error) {
    console.error('Error during product search:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
};
