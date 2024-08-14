import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../../infrastructure/repositories/UserRepository';
import VerificationTokenRepository from '../../infrastructure/repositories/VerificationTokenRepository';
import EmailService from '../../infrastructure/services/EmailService';
import env from '../../infrastructure/env/env';
import { emailVerificationSchema } from '../../validators/authValidators';
import { convertRelativeTimeToDate } from '../../infrastructure/utils/TimeUtils';
import TokenVerificationService from '../../infrastructure/services/TokenVerificationService';

class EmailVerificationController {
  private tokenVerificationService: TokenVerificationService;

  constructor() {
    const verificationTokenRepo = new VerificationTokenRepository();
    this.tokenVerificationService = new TokenVerificationService(
      verificationTokenRepo
    );
  }

  public sendVerificationEmail = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { email } = req.body;

    try {
      // Validate the email
      emailVerificationSchema.parse({ email });

      // Verify if a token for this email already exists and is valid
      const existingToken =
        await this.tokenVerificationService.verifyToken(email);
      if (existingToken.valid) {
        return res.status(409).json({
          message: 'A valid token already exists. Please check your email.',
        });
      }

      // Check if the user exists
      const user = await new UserRepository().getUserByEmail(email);
      if (user) {
        // If the user exists, suggest signing in instead of signing up
        return res
          .status(409)
          .json({ message: 'User already exists. Please sign in instead.' });
      }

      // Generate a verification token
      const token = uuidv4();
      const expirationDate = convertRelativeTimeToDate(
        env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME
      );
      await new VerificationTokenRepository().createToken({
        email,
        token,
        expiresAt: expirationDate,
      });

      // Construct the verification link with the token as a query parameter
      const verificationLink = `${env.FRONTEND_BASE_URL}${env.FRONTEND_VERIFICATION_ROUTE}?token=${token}`;

      // Send verification email
      await new EmailService().sendVerificationEmail({
        to: email,
        verificationLink,
      });

      return res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Error sending verification email:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export default new EmailVerificationController();
