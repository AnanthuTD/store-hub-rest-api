import { inject, injectable } from 'inversify';
import { IUser } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import IPasswordHasher from '../../domain/services/IPasswordHasher';
import { TYPES } from '../../config/types';
import { ITokenVerifier } from '../../domain/services/ITokenVerifier';
import { IVerificationTokenRepository } from '../../domain/repositories/IVerificationTokenRepository';

interface RegisterUserExecuteProps {
  password: string;
  firstName: string;
  lastName: string;
  token: string;
}

@injectable()
class RegisterUserUseCase {
  public constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.PasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
    @inject(TYPES.TokenVerifier)
    private readonly tokenVerifier: ITokenVerifier,
    @inject(TYPES.VerificationTokenRepository)
    private readonly verificationTokenRepository: IVerificationTokenRepository
  ) {}

  async execute({
    password,
    firstName,
    lastName,
    token,
  }: RegisterUserExecuteProps): Promise<IUser> {
    const { valid, message, email } =
      await this.tokenVerifier.verifyToken(token);
    if (!valid) {
      throw new Error(message);
    }

    const hashedPassword = await this.passwordHasher.hashPassword(password);
    const newUser: IUser = {
      email,
      password: hashedPassword,
      profile: { firstName, lastName },
    };

    this.verificationTokenRepository.removeToken(token);

    return await this.userRepository.createUser(newUser);
  }
}

export default RegisterUserUseCase;
