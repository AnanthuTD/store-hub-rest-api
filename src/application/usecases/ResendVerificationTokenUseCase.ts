import { inject, injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';
import EmailService from '../../infrastructure/services/EmailService';
import { v4 as uuidv4 } from 'uuid';
import { convertRelativeTimeToDate } from '../../infrastructure/utils/TimeUtils';
import env from '../../infrastructure/env/env';
import { TYPES } from '../../config/types';

interface ResendTokenResponse {
  statusCode: number;
  message: string;
}

@injectable()
export class ResendVerificationTokenUseCase {
  constructor(
    @inject(TYPES.IShopOwnerRepository)
    private readonly shopOwnerRepository: IShopOwnerRepository,

    @inject(TYPES.VerificationTokenRepository)
    private readonly tokenRepository: IVerificationTokenRepository,

    @inject(TYPES.EmailService)
    private readonly emailService: EmailService
  ) {}

  public async execute(
    email: string,
    verificationLink: string
  ): Promise<ResendTokenResponse> {
    // Check if the shop owner exists
    const shopOwner = await this.shopOwnerRepository.findByEmail(email);

    if (!shopOwner) {
      return { statusCode: 302, message: 'Redirecting to signup page.' }; // HTTP 302 for redirection
    }

    // Check if email is already verified
    if (shopOwner.emailVerified) {
      return { statusCode: 409, message: 'Email is already verified.' };
    }

    // Generate a new token and save it
    const token = uuidv4();
    const expirationDate = convertRelativeTimeToDate(
      env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME
    );

    this.tokenRepository.updateOrCreateToken({
      email,
      token,
      expiresAt: expirationDate,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail({
      to: email,
      verificationLink: `${verificationLink}?token=${token}&email=${email}`,
    });

    return {
      statusCode: 200,
      message: 'Verification email sent successfully.',
    };
  }
}
