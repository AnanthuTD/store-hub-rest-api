import express from 'express';
import passport from 'passport';
import { resendVerificationTokenController } from '../../controllers/vendor/auth/ResendVerificationController';
import { verifyTokenController } from '../../controllers/vendor/auth/VerifyEmailController';
import { signUpShopOwner } from '../../controllers/vendor/auth/SignUpController';
import { CredentialSignInShopOwner } from '../../controllers/vendor/auth/CredentialSignInControllor';
import { googleAuthController } from '../../controllers/vendor/auth/google.controller';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';
import googleAuth from '../../controllers/vendor/auth/googleAuth';

const shopOwnerRouter = express.Router();

shopOwnerRouter.post('/signin', CredentialSignInShopOwner);

shopOwnerRouter.post('/signup', signUpShopOwner);

shopOwnerRouter.get('/verify-email', verifyTokenController);

shopOwnerRouter.get('/resend-token', resendVerificationTokenController);

shopOwnerRouter.get(
  '/profile',
  passport.authenticate('shop-owner-jwt', { session: false }),
  (req, res) => {
    const partner = req.user as IDeliveryPartner;
    delete partner.authMethods;
    res.json(partner);
  }
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

shopOwnerRouter.get('/v2/google', googleAuth);

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

shopOwnerRouter.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.send();
});

export default shopOwnerRouter;
