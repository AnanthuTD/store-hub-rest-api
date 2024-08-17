import bcrypt from 'bcryptjs';
import { injectable } from 'inversify';
import IPasswordHasher from '../../domain/services/IPasswordHasher';

@injectable()
export default class BcryptPasswordHasher implements IPasswordHasher {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
