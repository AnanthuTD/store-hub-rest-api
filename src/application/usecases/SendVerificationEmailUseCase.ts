import { inject, injectable } from 'inversify';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';
import { ITokenVerifier } from '../../domain/services/ITokenVerifier';
import { TYPES } from '../../config/types';
import { convertRelativeTimeToDate } from '../../infrastructure/utils/TimeUtils';
import { v4 as uuidv4 } from 'uuid';
import env from '../../infrastructure/env/env';
import IEmailService from '../../domain/services/IEmailService';
import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import { IDeliveryPartnerRepository } from '../../domain/repositories/IDeliveryPartnerRepository';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import generateEmailTemplate, {
  EmailProcess,
} from '../../infrastructure/utils/emailTemplateGenerator';

interface SendVerificationEmailProps {
  email: string;
  role: 'admin' | 'shopOwner' | 'user' | 'deliveryPartner';
}

@injectable()
class SendVerificationEmailUseCase {
  private repositories: {
    user: IUserRepository;
    admin: IAdminRepository;
    deliveryPartner: IDeliveryPartnerRepository;
    shopOwner: IShopOwnerRepository;
  };
  public constructor(
    @inject(TYPES.UserRepository) userRepo: IUserRepository,
    @inject(TYPES.IAdminRepository) adminRepo: IAdminRepository,
    @inject(TYPES.DeliveryPartnerRepository)
    deliveryPartnerRepo: IDeliveryPartnerRepository,
    @inject(TYPES.IShopOwnerRepository) shopOwnerRepo: IShopOwnerRepository,
    @inject(TYPES.VerificationTokenRepository)
    private readonly tokenRepository: IVerificationTokenRepository,
    @inject(TYPES.EmailService) private readonly emailService: IEmailService,
    @inject(TYPES.TokenVerifier) private readonly tokenVerifier: ITokenVerifier
  ) {
    this.repositories = {
      user: userRepo,
      admin: adminRepo,
      deliveryPartner: deliveryPartnerRepo,
      shopOwner: shopOwnerRepo,
    };
  }

  public getRepository(role: string): IUserRepository {
    const repo = this.repositories[role];
    if (!repo) {
      throw new Error(`No repository found for role: ${role}`);
    }
    return repo;
  }

  async execute({ email, role }: SendVerificationEmailProps): Promise<void> {
    // Verify if a token for this email already exists and is valid
    const existingToken = await this.tokenVerifier.verifyToken(email);
    if (existingToken.valid) {
      throw new Error('A valid token already exists.');
    }

    const userRepo = this.getRepository(role);

    // Check if the user exists
    const user = await userRepo.getUserByEmail(email);
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
    const verificationLink = `${env.FRONTEND_BASE_URL}${env.FRONTEND_VERIFICATION_ROUTE}?token=${token}&email=${email}`;

    // Send verification email
    await this.emailService.sendVerificationEmail({
      to: email,
      subject: 'Please verify your email address',
      html: generateEmailTemplate({
        process: EmailProcess.SIGNUP_VERIFICATION,
        props: { name: email, role, verificationLink },
      }),
    });
  }
}

export default SendVerificationEmailUseCase;
