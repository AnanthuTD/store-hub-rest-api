import { Router } from 'express';
import passport from 'passport';
import { sanitizeInput } from '../middleware/sanitization';
import ProfileController from '../controllers/ProfileController';
import GoogleAuthController from '../controllers/GoogleAuthController';
import CredentialAuthController from '../controllers/CredentialAuthController';
import { fetchCountryCodes } from '../controllers/CountryCodeController';
import EmailVerificationController from '../controllers/EmailVerificationController';
import RegisterWithEmailController from '../controllers/RegisterWithEmailController';
import RegisterUserMobileController from '../controllers/RegisterWithMobileController';
import TokenVerificationController from '../controllers/TokenVerificationController';
import OTPController from '../controllers/OTPController';
import SigninMobileController from '../controllers/SigninMobileController';

const router = Router();

// get all country codes
router.get('/country-codes', fetchCountryCodes);

// verify token send by email
router.post('/verify-token', (req, res) =>
  new TokenVerificationController().verifyToken(req, res)
);

// send verification email to the user before signup
router.post(
  '/register/verify/email',
  EmailVerificationController.sendVerificationEmail
);

// register user with email, password, firstName, lastName
router.post('/register/email', sanitizeInput, (req, res) =>
  new RegisterWithEmailController().handle(req, res)
);

// register user with mobile number, password, firstName, lastName, countryCode
router.post('/register/mobile', (req, res) =>
  new RegisterUserMobileController().handle(req, res)
);

// sign-in with google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// sign-in with google callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  GoogleAuthController.handle
);

// get profile information of signed-in user
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ProfileController.handle
);

// sign-in with local credentials (email and password)
router.post(
  '/signin/credentials',
  passport.authenticate('local', { session: false }),
  CredentialAuthController.handle
);

// send OTP to user's registered mobile number
router.post('/otp/send', (req, res) => new OTPController().sendOTP(req, res));

// sign-in with mobile number, otp and country code
router.post('/signin/mobile', (req, res) =>
  new SigninMobileController().handle(req, res)
);

export default router;
