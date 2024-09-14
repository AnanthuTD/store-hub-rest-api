import { Request, Response } from 'express';
import Category from '../../../infrastructure/database/models/CategoryModel';

interface CategoryData {
  parentCategory: string;
  name: string;
  status: string;
  description: string;
  imageUrl: string;
}

export async function updatedCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { parentCategory, name, status, description } = req.body;
  const image = req.file;

  try {
    const updateFields: CategoryData = {
      parentCategory,
      name,
      status,
      description,
      imageUrl: '',
    };

    if (image) {
      // The S3 URL is available in image.location
      updateFields.imageUrl = image.location;
    }

    // Find the category by ID and update
    const updatedCategory = await Category.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
