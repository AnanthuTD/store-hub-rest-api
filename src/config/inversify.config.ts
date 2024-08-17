import { Container } from 'inversify';
import { TYPES } from './types';
import IPasswordHasher from '../domain/services/IPasswordHasher';
import BcryptPasswordHasher from '../infrastructure/services/PasswordHasher';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import UserRepository from '../infrastructure/repositories/UserRepository';
import RegisterUserUseCase from '../application/usecases/RegisterUserWithEmail';
import { ITokenVerifier } from '../domain/services/ITokenVerifier';
import TokenVerifier from '../infrastructure/services/TokenVerifier';
import { IVerificationTokenRepository } from '../domain/repositories/IVerificationTokenRepository';
import VerificationTokenRepository from '../infrastructure/repositories/VerificationTokenRepository';
import SendVerificationEmailUseCase from '../application/usecases/SendVerificationEmailUseCase';
import IEmailService from '../domain/services/IEmailService';
import EmailService from '../infrastructure/services/EmailService';
import IOTPService from '../domain/services/IOTPService';
import { OTPService } from '../infrastructure/services/OTPService';
import RegisterUserWithMobile from '../application/usecases/RegisterUserWithMobile';

const container = new Container();
container.bind<IPasswordHasher>(TYPES.PasswordHasher).to(BcryptPasswordHasher);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container
  .bind<RegisterUserUseCase>(TYPES.RegisterUserUseCase)
  .to(RegisterUserUseCase);
container.bind<ITokenVerifier>(TYPES.TokenVerifier).to(TokenVerifier);
container
  .bind<IVerificationTokenRepository>(TYPES.VerificationTokenRepository)
  .to(VerificationTokenRepository);
container
  .bind<SendVerificationEmailUseCase>(TYPES.SendVerificationEmailUseCase)
  .to(SendVerificationEmailUseCase);
container.bind<IEmailService>(TYPES.EmailService).to(EmailService);
container.bind<IOTPService>(TYPES.OTPService).to(OTPService);
container
  .bind<RegisterUserWithMobile>(TYPES.RegisterUserWithMobile)
  .to(RegisterUserWithMobile);
export { container };
