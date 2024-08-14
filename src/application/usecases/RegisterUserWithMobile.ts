import bcrypt from 'bcryptjs';
import { IUser } from '../../domain/entities/User';
import { OTPService } from './OTPService';
import { IUserRepository } from '../interfaces/IUserRepository';

interface MobileNumberRegisterUserExecuteProps {
  mobileNumber: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
}

class MobileNumberRegisterUser {
  private userRepository: IUserRepository;
  private otpService: OTPService;

  constructor(userRepository: IUserRepository, otpService: OTPService) {
    this.userRepository = userRepository;
    this.otpService = otpService;
  }

  async execute({
    mobileNumber,
    otp,
    password,
    firstName,
    lastName,
  }: MobileNumberRegisterUserExecuteProps): Promise<IUser> {
    try {
      // Verify the OTP
      const verificationResponse = await this.otpService.verifyOTP(
        mobileNumber,
        otp
      );
      console.log('OTP Verification Response:', verificationResponse);

      // Check if the OTP is valid and approved
      if (
        !verificationResponse.valid ||
        verificationResponse.status !== 'approved'
      ) {
        throw new Error('Invalid or unapproved OTP.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user
      const newUser: IUser = {
        mobileNumber,
        password: hashedPassword,
        profile: { firstName, lastName },
      };

      // Save the new user
      return await this.userRepository.createUser(newUser);
    } catch (error) {
      // Handle errors
      console.error('Error during registration:', error.message);
      throw error;
    }
  }
}

export default MobileNumberRegisterUser;
