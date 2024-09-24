import { Request, Response } from 'express';
import Category from '../../../../infrastructure/database/models/CategoryModel';
import logger from '../../../../infrastructure/utils/logger';

export default async function getChildCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { parentCategoryId } = req.params;

    const categories = await Category.find(
      { parentCategory: parentCategoryId },
      { _id: 1, name: 1 }
    ).lean();
    res.status(200).json({
      categories,
      message: 'Successfully retrieved child categories',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving child categories' });
    logger.error(error);
  }
}
