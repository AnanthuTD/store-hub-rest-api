import { Request, Response } from 'express';
import Category from '../../../infrastructure/database/models/CategoryModel';

export async function addCategory(req: Request, res: Response) {
  try {
    const { parentCategory, name, description } = req.body;
    const image = req.file;

    // Check if the category name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists.' });
    }

    // Create and save the new category
    const newCategory = new Category({
      parentCategory: parentCategory || null,
      name,
      description,
      imageUrl: (image?.location as string) || '',
      status: 'active',
    });

    await newCategory.save();

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
