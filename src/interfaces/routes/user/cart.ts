import express from 'express';
import {
  addToCart,
  checkItemInCart,
  decrementProductInCart,
  getCartItems,
  removeProductFromCart,
} from '../../controllers/user/cart/index';
const router = express.Router();

router.get('/', getCartItems);
router.get('/check', checkItemInCart);
router.post('/add', addToCart);
router.patch('/decrement', decrementProductInCart);
router.delete('/remove', removeProductFromCart);

export default router;
