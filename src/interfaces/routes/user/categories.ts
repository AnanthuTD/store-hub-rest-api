import express from 'express';
import getParentCategories from '../../controllers/user/category/getParentCategories.controller';
import getChildCategories from '../../controllers/user/category/getChildCategories.controller';
import { getParentCategoriesOfChildController } from '../../controllers/user/category/getParentCategoriesOfChild';
const router = express.Router();

router.get('/parent', getParentCategories);
router.get('/:parentCategoryId/childs', getChildCategories);
router.get('/child/:childId/parent', getParentCategoriesOfChildController);

export default router;
