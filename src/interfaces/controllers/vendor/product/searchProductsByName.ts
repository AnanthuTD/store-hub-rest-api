import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

export default async function searchProductsByName(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const searchTerm = req.query.search;
    if (!searchTerm) {
      res.status(200).json([]);
      return;
    }

    const products = await Products.find({
      $text: { $search: searchTerm as string },
    })
      .select('name _id')
      .limit(20);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error searching products', error });
  }
}
