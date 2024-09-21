import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

// Suggest Products API
export const suggestProducts = async (req: Request, res: Response) => {
  const { query } = req.query;

  try {
    if (typeof query !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter' });
    }

    // Perform a text search for suggestions
    const products = await Products.find({
      $text: { $search: query },
    }).limit(10); // Limit the number of suggestions

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
