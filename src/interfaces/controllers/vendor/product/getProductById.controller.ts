import { Request, Response } from 'express';
import Products from '../../../../infrastructure/database/models/ProductsSchema';
import logger from '../../../../infrastructure/utils/logger';

export default async function getProductById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(200).json({ message: 'Invalid product ID', product: {} });
      return;
    }

    // Fetch product from database using productId
    const product = await Products.findById(productId);

    if (!product) {
      res.status(200).json({ message: 'Product not found', product: {} });
      return;
    }

    res.status(200).json({ message: 'Product successfully fetched', product });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}
