import { Request, Response } from 'express';
import Category from '../../../../infrastructure/database/models/CategoryModel';
import logger from '../../../../infrastructure/utils/logger';

export default async function getParentCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const categories = await Category.find(
      { parentCategory: null },
      { _id: 1, name: 1 }
    ).lean();
    res.status(200).json({
      categories,
      message: 'Successfully retrieved parent categories',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving parent categories' });
    logger.error(error);
  }
}
