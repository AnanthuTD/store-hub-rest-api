import { Request, Response } from 'express';
import Category from '../../../../infrastructure/database/models/CategoryModel';

// Recursive function to fetch all parent categories
const getParentCategories = async (
  categoryId: string,
  parents: any[] = []
): Promise<any[]> => {
  const category =
    await Category.findById(categoryId).populate('parentCategory');

  if (!category) {
    throw new Error('Category not found');
  }

  // If there is a parent category, add it to the parents array
  if (category.parentCategory) {
    parents.push(category.parentCategory);
    // Recursively find the parent of the parent category
    return getParentCategories(category.parentCategory._id, parents);
  }

  return parents; // Base case: no parent, return the collected parents
};

// Controller to handle the request
export const getParentCategoriesOfChildController = async (
  req: Request,
  res: Response
) => {
  const { childId } = req.params;

  console.log('child id: ', childId);

  try {
    const childCategory = await Category.findById(childId);
    // Fetch the list of parent categories
    const parentCategories = await getParentCategories(childId);

    // Return the list of parent categories
    res.status(200).json({
      success: true,
      parentCategories: [...parentCategories, childCategory],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
