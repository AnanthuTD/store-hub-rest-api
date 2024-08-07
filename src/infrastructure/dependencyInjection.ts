import { IRegisterUser } from '../application/interfaces/IRegisterUser';
import RegisterUser from '../application/usecases/RegisterUser';
import RegisterController from '../interfaces/controllers/RegisterController';
import UserRepository from './repositories/UserRepository';

// Repositories
const userRepository = new UserRepository();

// Controllers
const registerUser: IRegisterUser = new RegisterUser(userRepository);
const registerController = new RegisterController(registerUser);

export { registerController };
