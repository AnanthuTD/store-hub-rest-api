import express from 'express';
import {
  addToCart,
  checkItemInCart,
  decrementProductInCart,
  getCartItems,
  removeProductFromCart,
} from '../../controllers/user/cart/index';
import { calculateTotalPrice } from '../../controllers/user/cart/computeCartTotalPrice.controller';
const router = express.Router();

router.get('/', getCartItems);
router.get('/check', checkItemInCart);
router.post('/add', addToCart);
router.patch('/decrement', decrementProductInCart);
router.delete('/remove', removeProductFromCart);
router.get('/total', calculateTotalPrice);

export default router;
