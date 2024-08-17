import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import IPasswordHasher from '../../domain/services/IPasswordHasher';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../config/types';
import IOTPService from '../../domain/services/IOTPService';
import logger from '../../infrastructure/utils/logger';

interface MobileNumberRegisterUserExecuteProps {
  mobileNumber: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
}

@injectable()
class RegisterUserWithMobile {
  public constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
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

      // Save the new user
      await this.userRepository.createUser(newUser);
    } catch (error) {
      // Handle errors
      logger.error('Error during registration:', error);
      throw error;
    }
  }
}

export default RegisterUserWithMobile;
