import express from 'express';
import passport from 'passport';
import { resendVerificationTokenController } from '../../controllers/ShopOwner/ResendVerificationController';
import { verifyTokenController } from '../../controllers/ShopOwner/VerifyEmailController';
import { signUpShopOwner } from '../../controllers/ShopOwner/SignUpController';
import { CredentialSignInShopOwner } from '../../controllers/ShopOwner/CredentialSignInControllor';
import updateShopOwner from '../../controllers/ShopOwner/RegisterShopOwnerController';
import ProfileController from '../../controllers/ProfileController';
import { googleAuthController } from '../../controllers/ShopOwner/google.controller';
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

/**
 * @openapi
 * /google:
 *   get:
 *     summary: Google sign-in
 *     tags:
 *      - User
 *     description: Initiates Google sign-in process.
 *     responses:
 *       302:
 *         description: Redirects to Google sign-in
 */
shopOwnerRouter.get(
  '/google',
  passport.authenticate('shop-owner-google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * @openapi
 * /google/callback:
 *   get:
 *     summary: Google sign-in callback
 *     tags:
 *      - User
 *     description: Handles the callback from Google sign-in.
 *     responses:
 *       302:
 *         description: Redirects to application with authentication details
 *       400:
 *         description: Authentication failed
 */
shopOwnerRouter.get(
  '/google/callback',
  passport.authenticate('shop-owner-google', {
    failureRedirect: '/',
    session: false,
  }),
  googleAuthController
);

export default shopOwnerRouter;
