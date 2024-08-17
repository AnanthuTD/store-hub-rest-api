import { inject, injectable } from 'inversify';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';
import { ITokenVerifier } from '../../domain/services/ITokenVerifier';
import { TYPES } from '../../config/types';
import { convertRelativeTimeToDate } from '../../infrastructure/utils/TimeUtils';
import { v4 as uuidv4 } from 'uuid';
import env from '../../infrastructure/env/env';
import IEmailService from '../../domain/services/IEmailService';

interface SendVerificationEmailProps {
  email: string;
}

@injectable()
class SendVerificationEmailUseCase {
  public constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.VerificationTokenRepository)
    private readonly tokenRepository: IVerificationTokenRepository,
    @inject(TYPES.EmailService) private readonly emailService: IEmailService,
    @inject(TYPES.TokenVerifier) private readonly tokenVerifier: ITokenVerifier
  ) {}

  async execute({ email }: SendVerificationEmailProps): Promise<void> {
    // Verify if a token for this email already exists and is valid
    const existingToken = await this.tokenVerifier.verifyToken(email);
    if (existingToken.valid) {
      throw new Error('A valid token already exists.');
    }

    // Check if the user exists
    const user = await this.userRepository.getUserByEmail(email);
    if (user) {
      throw new Error('User already exists.');
    }

    // Generate a verification token
    const token = uuidv4();
    const expirationDate = convertRelativeTimeToDate(
      env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME
    );
    await this.tokenRepository.createToken({
      email,
      token,
      expiresAt: expirationDate,
    });

    // Construct the verification link with the token as a query parameter
    const verificationLink = `${process.env.FRONTEND_BASE_URL}${process.env.FRONTEND_VERIFICATION_ROUTE}?token=${token}`;

    // Send verification email
    await this.emailService.sendVerificationEmail({
      to: email,
      verificationLink,
    });
  }
}

export default SendVerificationEmailUseCase;
