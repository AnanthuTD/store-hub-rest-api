import express from 'express';
import {
  addToCart,
  checkItemInCart,
  decrementProductInCart,
  getCartItems,
  getTotalQuantity,
  removeProductFromCart,
} from '../../controllers/user/cart/index';
import { calculateTotalPrice } from '../../controllers/user/cart/computeCartTotalPrice.controller';
import { cartSummary } from '../../controllers/user/cart/cartSummary.controller';
const router = express.Router();

router.get('/', getCartItems);
router.get('/check', checkItemInCart);
router.post('/add', addToCart);
router.patch('/decrement', decrementProductInCart);
router.delete('/remove', removeProductFromCart);
router.get('/total', calculateTotalPrice);
router.get('/summary', cartSummary);
router.get('/count', getTotalQuantity);

export default router;
