import express from 'express';
import { signInAdmin } from '../../controllers/admin/AdminController';
import passport from 'passport';
import ProfileController from '../../controllers/common/ProfileController';
import googleAuth from '../../controllers/admin/googleAuth';
const adminRouter = express.Router();

const profileController = new ProfileController();

adminRouter.post('/signin', signInAdmin);

adminRouter.get('/v2/google', googleAuth);

adminRouter.get(
  '/profile',
  passport.authenticate('admin-jwt', { session: false }),
  (req, res) => profileController.handle(req, res)
);

adminRouter.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.send();
});

export default adminRouter;
