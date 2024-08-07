import bcrypt from 'bcryptjs';
import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';

class RegisterUser {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute(email: string, password: string): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    // @ts-expect-error id created automatically
    const newUser: IUser = { email, password: hashedPassword };
    return await this.userRepository.createUser(newUser);
  }
}

export default RegisterUser;
