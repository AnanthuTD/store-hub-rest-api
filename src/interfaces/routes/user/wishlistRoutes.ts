import express from 'express';
import { WishlistRepository } from '../../../infrastructure/repositories/WishlistRepository';
import { AddToWishlist } from '../../../application/usecases/AddToWishlist';
import { GetWishlist } from '../../../application/usecases/GetWishlist';
import { WishlistController } from '../../controllers/WishlistController';
import { RemoveFromWishlist } from '../../../application/usecases/RemoveFromWishlist';

const wishlistRouter = express.Router();

const wishlistRepository = new WishlistRepository();
const addToWishlist = new AddToWishlist(wishlistRepository);
const getWishlist = new GetWishlist(wishlistRepository);
const removeFromWishlist = new RemoveFromWishlist(wishlistRepository);
const wishlistController = new WishlistController(
  addToWishlist,
  getWishlist,
  removeFromWishlist
);

wishlistRouter.post('/add', (req, res) => wishlistController.addItem(req, res));
wishlistRouter.get('/', (req, res) => wishlistController.getWishlist(req, res));
wishlistRouter.get('/:wishlistId/remove', (req, res) =>
  wishlistController.removeFromWishlist(req, res)
);

export default wishlistRouter;
