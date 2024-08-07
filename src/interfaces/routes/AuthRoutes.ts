import { Router } from 'express';
import passport from 'passport';
import { sanitizeInput } from '../middleware/sanitization';
import {
  otpController,
  registerController,
} from '../../infrastructure/dependencyInjection';
import ProfileController from '../controllers/ProfileController';
import GoogleAuthController from '../controllers/GoogleAuthController';
import CredentialAuthController from '../controllers/CredentialAuthController';

const router = Router();

router.get('/', (req, res) => {
  res.json({ hi: 'auth' });
});

router.post(
  '/register',
  sanitizeInput,
  registerController.handle.bind(registerController)
);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  GoogleAuthController.handle
);

router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ProfileController.handle
);

router.post(
  '/login/credentials',
  sanitizeInput,
  passport.authenticate('local'),
  CredentialAuthController.handle
);

router.post('/otp/send', otpController.sendOTP.bind(otpController));
router.post('/otp/verify', otpController.verifyOTP.bind(otpController));

export default router;
