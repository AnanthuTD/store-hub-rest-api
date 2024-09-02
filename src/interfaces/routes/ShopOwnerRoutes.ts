import express from 'express';
import { CredentialSignInShopOwner } from '../controllers/ShopOwner/CredentialSignInControllor';
import { signUpShopOwner } from '../controllers/ShopOwner/SignUpController';
import { verifyTokenController } from '../controllers/ShopOwner/VerifyEmailController';
import { resendVerificationTokenController } from '../controllers/ShopOwner/ResendVerificationController';
import passport from 'passport';
import updateShopOwner from '../controllers/ShopOwner/RegisterShopOwnerController';

const router = express.Router();

router.post('/signin', CredentialSignInShopOwner);

router.post('/signup', signUpShopOwner);

router.get('/verify-email', verifyTokenController);

router.get('/resend-token', resendVerificationTokenController);

router.post(
  '/register',
  passport.authenticate('shop', { session: false }),
  updateShopOwner
);

router.get('/profile');

export default router;
