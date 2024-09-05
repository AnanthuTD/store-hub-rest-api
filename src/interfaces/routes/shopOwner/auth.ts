import express from 'express';
import passport from 'passport';
import { resendVerificationTokenController } from '../../controllers/ShopOwner/ResendVerificationController';
import { verifyTokenController } from '../../controllers/ShopOwner/VerifyEmailController';
import { signUpShopOwner } from '../../controllers/ShopOwner/SignUpController';
import { CredentialSignInShopOwner } from '../../controllers/ShopOwner/CredentialSignInControllor';
import updateShopOwner from '../../controllers/ShopOwner/RegisterShopOwnerController';
import ProfileController from '../../controllers/ProfileController';
const shopOwnerRouter = express.Router();

const profileController = new ProfileController();

shopOwnerRouter.post('/signin', CredentialSignInShopOwner);

shopOwnerRouter.post('/signup', signUpShopOwner);

shopOwnerRouter.get('/verify-email', verifyTokenController);

shopOwnerRouter.get('/resend-token', resendVerificationTokenController);

shopOwnerRouter.post(
  '/register',
  passport.authenticate('shop-owner-jwt', { session: false }),
  updateShopOwner
);

shopOwnerRouter.get(
  '/profile',
  passport.authenticate('shop-owner-jwt', { session: false }),
  (req, res) => profileController.handle(req, res)
);

export default shopOwnerRouter;
