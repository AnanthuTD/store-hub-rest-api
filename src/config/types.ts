const TYPES = {
  UserRepository: Symbol.for('UserRepository'),
  PasswordHasher: Symbol.for('PasswordHasher'),
  RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  TokenVerifier: Symbol.for('TokenVerifier'),
  VerificationTokenRepository: Symbol.for('VerificationTokenRepository'),
};

export { TYPES };
