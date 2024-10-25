import express from 'express';
import { WishlistRepository } from '../../../infrastructure/repositories/WishlistRepository';
import { AddToWishlist } from '../../../application/usecases/AddToWishlist';
import { GetWishlist } from '../../../application/usecases/GetWishlist';
import { WishlistController } from '../../controllers/WishlistController';
import { RemoveFromWishlist } from '../../../application/usecases/RemoveFromWishlist';
import { CheckItemInWishlist } from '../../../application/usecases/CheckItemInWishlist';

const wishlistRouter = express.Router();

const wishlistRepository = new WishlistRepository();
const addToWishlist = new AddToWishlist(wishlistRepository);
const getWishlist = new GetWishlist(wishlistRepository);
const removeFromWishlist = new RemoveFromWishlist(wishlistRepository);
const checkItemInWishlist = new CheckItemInWishlist(wishlistRepository);
const wishlistController = new WishlistController(
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  checkItemInWishlist
);

wishlistRouter.post('/add', (req, res) => wishlistController.addItem(req, res));
wishlistRouter.get('/', (req, res) => wishlistController.getWishlist(req, res));
wishlistRouter.delete('/:productId/remove', (req, res) =>
  wishlistController.removeFromWishlist(req, res)
);
wishlistRouter.get('/check/:productId', (req, res) =>
  wishlistController.checkItemInWishlist(req, res)
);

export default wishlistRouter;
