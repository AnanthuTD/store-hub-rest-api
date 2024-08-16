import bcrypt from 'bcryptjs';
import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';

interface RegisterUserExecuteProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

class RegisterUser {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({
    email,
    password,
    firstName,
    lastName,
  }: RegisterUserExecuteProps): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: IUser = {
      email,
      password: hashedPassword,
      profile: { firstName, lastName },
    };
    return await this.userRepository.createUser(newUser);
  }
}

export default RegisterUser;
