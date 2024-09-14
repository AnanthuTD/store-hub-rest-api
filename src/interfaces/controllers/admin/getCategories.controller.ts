import { Request, Response } from 'express';
import Category from '../../../infrastructure/database/models/CategoryModel';

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await Category.find().populate('parentCategory');
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
