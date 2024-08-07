import { IRegisterUser } from '../application/interfaces/IRegisterUser';
import { OTPService } from '../application/usecases/OTPService';
import RegisterUser from '../application/usecases/RegisterUser';
import OTPController from '../interfaces/controllers/OTPController';
import RegisterController from '../interfaces/controllers/RegisterController';
import UserRepository from './repositories/UserRepository';

// Repositories
const userRepository = new UserRepository();

// Controllers
const registerUser: IRegisterUser = new RegisterUser(userRepository);
const registerController = new RegisterController(registerUser);

const otpService = new OTPService();
export const otpController = new OTPController(otpService);

export { registerController };
