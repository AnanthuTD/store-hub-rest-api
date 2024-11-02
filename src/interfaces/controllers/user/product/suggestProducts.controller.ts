import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

// Suggest Products API
export const suggestProducts = async (req: Request, res: Response) => {
  const { query } = req.query;

  try {
    if (typeof query !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter' });
    }

    // Perform a regex search for suggestions
    const regex = new RegExp(query, 'i');
    const products = await Products.find({ name: { $regex: regex } })
      .limit(10)
      .exec();

    // Extract product names for suggestions
    const suggestions = products
      .map((product) => product.name)
      .filter((name) => name);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error during product suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};
