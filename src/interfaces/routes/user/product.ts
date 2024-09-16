import express from 'express';
import { searchProducts } from '../../controllers/user/searchProducts';

const userRouter = express.Router();

userRouter.get('/search', searchProducts);

export default userRouter;
