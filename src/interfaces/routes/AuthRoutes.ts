import { Router } from 'express';
import passport from 'passport';
import { sanitizeInput } from '../middleware/sanitization';
import {
  otpController,
  otpLoginController,
  otpRegisterController,
  registerController,
  tokenVerificationController,
} from '../../infrastructure/dependencyInjection';
import ProfileController from '../controllers/ProfileController';
import GoogleAuthController from '../controllers/GoogleAuthController';
import CredentialAuthController from '../controllers/CredentialAuthController';
import { fetchCountryCodes } from '../controllers/CountryCodeController';
import EmailVerificationController from '../controllers/EmailVerificationController';

const router = Router();

router.get('/', (req, res) => {
  res.json({ hi: 'auth' });
});

router.get('/country-codes', fetchCountryCodes);

router.post(
  '/verify-token',
  tokenVerificationController.verifyToken.bind(tokenVerificationController)
);

router.post('/verify-email', EmailVerificationController.sendVerificationEmail);

router.post(
  '/register',
  sanitizeInput,
  registerController.handle.bind(registerController)
);

router.post(
  '/register-otp',
  otpRegisterController.register.bind(otpRegisterController)
);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  GoogleAuthController.handle
);

router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ProfileController.handle
);

router.post(
  '/sign-in/credentials',
  passport.authenticate('local', { session: false }),
  CredentialAuthController.handle
);

router.post('/otp/send', otpController.sendOTP.bind(otpController));

router.post(
  '/signin/otp',
  otpLoginController.loginWithOTP.bind(otpLoginController)
);

router.post('/otp/verify', otpController.verifyOTP.bind(otpController));

export default router;
