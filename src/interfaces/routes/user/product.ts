import express from 'express';
import { searchProducts } from '../../controllers/user/searchProducts';
import { suggestProducts } from '../../controllers/user/suggestProducts.controller';

const userRouter = express.Router();

userRouter.get('/search', searchProducts);
userRouter.get('/suggest', suggestProducts);

export default userRouter;
