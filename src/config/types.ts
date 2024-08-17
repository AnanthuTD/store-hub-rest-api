const TYPES = {
  UserRepository: Symbol.for('UserRepository'),
  PasswordHasher: Symbol.for('PasswordHasher'),
  RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  TokenVerifier: Symbol.for('TokenVerifier'),
  VerificationTokenRepository: Symbol.for('VerificationTokenRepository'),
  SendVerificationEmailUseCase: Symbol.for('SendVerificationEmailUseCase'),
  EmailService: Symbol.for('EmailService'),
};

export { TYPES };
