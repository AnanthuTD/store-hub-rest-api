import { Router } from 'express';
import passport from 'passport';
import { sanitizeInput } from '../../middleware/sanitization';
import ProfileController from '../../controllers/common/ProfileController';
import GoogleAuthController from '../../controllers/common/GoogleAuthController';
import CredentialAuthController from '../../controllers/common/CredentialAuthController';
import RegisterWithEmailController from '../../controllers/common/RegisterWithEmailController';
import RegisterUserMobileController from '../../controllers/common/RegisterWithMobileController';
import TokenVerificationController from '../../controllers/common/TokenVerificationController';
import OTPController from '../../controllers/common/OTPController';
import SigninMobileController from '../../controllers/common/SigninMobileController';
import EmailVerificationController from '../../controllers/common/EmailVerificationController';
import googleAuth from '../../controllers/user/googleAuth';

const userAuthRouter = Router();

// Instantiate controllers
const emailVerificationController = new EmailVerificationController();
const profileController = new ProfileController();
const googleAuthController = new GoogleAuthController();
const credentialAuthController = new CredentialAuthController();
const registerWithEmailController = new RegisterWithEmailController();
const registerUserMobileController = new RegisterUserMobileController();
const tokenVerificationController = new TokenVerificationController();
const otpController = new OTPController();
const signinMobileController = new SigninMobileController();

/**
 * @openapi
 * /register/{method}:
 *   post:
 *     summary: Register user
 *     tags:
 *      - User
 *     description: Registers a user with email or mobile based on the method provided.
 *     parameters:
 *       - in: path
 *         name: method
 *         required: true
 *         schema:
 *           type: string
 *           enum: [email, mobile]
 *         description: The registration method.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               countryCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Invalid registration method
 */
userAuthRouter.post('/register/:method', sanitizeInput, (req, res) => {
  const { method } = req.params;
  if (method === 'email') {
    return registerWithEmailController.handle(req, res);
  } else if (method === 'mobile') {
    return registerUserMobileController.handle(req, res, 'user');
  } else {
    return res.status(400).json({ error: 'Invalid registration method' });
  }
});

/**
 * @openapi
 * /signin/{method}:
 *   post:
 *     summary: Sign in user
 *     tags:
 *      - User
 *     description: Signs in a user with credentials or mobile based on the method provided.
 *     parameters:
 *       - in: path
 *         name: method
 *         required: true
 *         schema:
 *           type: string
 *           enum: [credentials, mobile]
 *         description: The sign-in method.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               otp:
 *                 type: string
 *               countryCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sign-in successful with token
 *       400:
 *         description: Invalid sign-in method or credentials
 */
userAuthRouter.post(
  '/signin/credential',
  passport.authenticate('local', { session: false }),
  (req, res) => credentialAuthController.handle(req, res)
);

userAuthRouter.post('/signin/mobile', (req, res) =>
  signinMobileController.handle(req, res)
);

/**
 * @openapi
 * /verify/email:
 *   post:
 *     summary: Send email verification
 *     description: Sends an email verification link to the user's email address.
 *     tags:
 *       - User Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address to which the verification link will be sent.
 *             required:
 *               - email
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, admin, deliveryPartner, shopOwner]
 *           description: The role of the user for whom the verification email is being sent.
 *     responses:
 *       200:
 *         description: Verification email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Verification email sent'
 *       400:
 *         description: Bad request due to invalid input or unknown server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Unknown server error'
 *       409:
 *         description: Conflict due to a valid token already existing or user already existing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'A valid token already exists.'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Internal server error'
 */
userAuthRouter.post('/verify/email', (req, res) =>
  emailVerificationController.sendVerificationEmail(req, res, 'user')
);

/**
 * @openapi
 * /email/verify-token:
 *   post:
 *     summary: Verify email token
 *     tags:
 *      - User
 *     description: Verifies the token sent to the user's email.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token verified successfully
 *       400:
 *         description: Invalid token
 */
userAuthRouter.post('/email/verify-token', (req, res) =>
  tokenVerificationController.verifyToken(req, res)
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
userAuthRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

userAuthRouter.get('/v2/google', googleAuth);

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
userAuthRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  (req, res) => googleAuthController.handle(req, res)
);

/**
 * @openapi
 * /otp/send:
 *   post:
 *     summary: Send OTP
 *     tags:
 *      - User
 *     description: Sends an OTP to the user's registered mobile number.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Failed to send OTP
 */
userAuthRouter.post('/otp/send', (req, res) => otpController.sendOTP(req, res));

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags:
 *      - User
 *     description: Retrieves the profile information of the signed-in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile information
 *       401:
 *         description: Unauthorized access
 */
userAuthRouter.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => profileController.handle(req, res)
);

userAuthRouter.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.send();
});

export default userAuthRouter;
