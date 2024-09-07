import express from 'express';
import { signInAdmin } from '../../controllers/admin/AdminController';
import passport from 'passport';
import ProfileController from '../../controllers/ProfileController';
const adminRouter = express.Router();

const profileController = new ProfileController();

adminRouter.post('/signin', signInAdmin);

adminRouter.get(
  '/profile',
  passport.authenticate('admin-jwt', { session: false }),
  (req, res) => profileController.handle(req, res)
);

export default adminRouter;
