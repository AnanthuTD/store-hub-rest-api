import { IUser } from '../../domain/entities/User';
import IPasswordHasher from '../../domain/services/IPasswordHasher';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../config/types';
import IOTPService from '../../domain/services/IOTPService';
import RepositoryFactory from './RepositoryFactory';
import { container } from '../../config/inversify.config';
import logger from '../../infrastructure/utils/logger';

interface MobileNumberRegisterUserExecuteProps {
  mobileNumber: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'deliveryPartner';
}

@injectable()
class RegisterUserWithMobile {
  public constructor(
    @inject(TYPES.PasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
    @inject(TYPES.OTPService)
    private readonly otpService: IOTPService
  ) {}

  async execute({
    mobileNumber,
    otp,
    password,
    firstName,
    lastName,
    role,
  }: MobileNumberRegisterUserExecuteProps): Promise<undefined> {
    try {
      // Verify the OTP
      await this.otpService.verifyOTP(mobileNumber, otp);

      // Hash the password
      const hashedPassword = await this.passwordHasher.hashPassword(password);

      // Create a new user
      const newUser: IUser = {
        mobileNumber,
        password: hashedPassword,
        profile: { firstName, lastName },
      };

      if (role === 'deliveryPartner' || role === 'user') {
        const userRepo = container
          .get<RepositoryFactory>(TYPES.RepositoryFactory)
          .getRepository(role);

        await userRepo.create(newUser);
      }

      // Save the new user
    } catch (error) {
      // Handle errors
      logger.error('Error during registration:', error);
      throw error;
    }
  }
}

export default RegisterUserWithMobile;
