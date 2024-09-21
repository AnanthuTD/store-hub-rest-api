import express from 'express';
import { upload } from '../../middleware/multerS3Config';
import { addCategory } from '../../controllers/admin/category/addCategory.controller';
import { getCategories } from '../../controllers/common/getCategories.controller';
import { updatedCategory } from '../../controllers/admin/category/updateCategory.controller';

const router = express.Router();

// Route to add a new category with image upload
router.post('/', upload.single('image'), addCategory);

// Route to get all categories
router.get('/', getCategories);

// Route to update a category
router.put('/:id', upload.single('image'), updatedCategory);

export default router;
