import { Request, Response } from 'express';
import Products from '../../../infrastructure/database/models/ProductsSchema';

export default async function (req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.params;

    const product = await Products.findById(productId).lean();

    res.status(200).json({ product, message: 'Product found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}
