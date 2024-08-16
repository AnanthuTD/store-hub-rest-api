import { OTPService } from '../application/usecases/OTPService';
import RegisterUser from '../application/usecases/RegisterUserWithEmail';
import OTPController from '../interfaces/controllers/OTPController';
import RegisterController from '../interfaces/controllers/EmailRegisterController';
import TokenVerificationController from '../interfaces/controllers/TokenVerificationController';
import UserRepository from './repositories/UserRepository';
import VerificationTokenRepository from './repositories/VerificationTokenRepository';
import TokenVerificationService from './services/TokenVerificationService';
import { OTPRegisterController } from '../interfaces/controllers/OTPRegisterController';
import MobileNumberRegisterUser from '../application/usecases/RegisterUserWithMobile';
import OTPLoginController from '../interfaces/controllers/OTPLoginController';

// Repositories
const userRepository = new UserRepository();
const verificationTokenRepository = new VerificationTokenRepository();

// Services
const tokenVerificationService = new TokenVerificationService(
  verificationTokenRepository
);
const otpService = new OTPService();
const mobileRegisterUser = new MobileNumberRegisterUser(
  userRepository,
  otpService
);

// user case
const registerUser = new RegisterUser(userRepository);

// Controllers
const registerController = new RegisterController(
  registerUser,
  tokenVerificationService
);
const otpController = new OTPController(otpService);
const tokenVerificationController = new TokenVerificationController(
  tokenVerificationService
);

const otpRegisterController = new OTPRegisterController(mobileRegisterUser);

const otpLoginController = new OTPLoginController(otpService, userRepository);

export {
  registerController,
  otpController,
  tokenVerificationController,
  otpRegisterController,
  otpLoginController,
};
