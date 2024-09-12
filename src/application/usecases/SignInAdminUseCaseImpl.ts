// src/application/usecases/SignInAdminUseCaseImpl.ts
import { injectable, inject } from 'inversify';
import { ISignInAdminUseCase } from './SignInAdminUseCase';
import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import { IHashService } from '../../domain/services/IHashService';
import { TYPES } from '../../config/types';
import TokenService from '../../infrastructure/services/TokenService';
import {
  AdminSignInResponseDTO,
  toAdminSignInResponseDTO,
} from '../dto/adminSignInResponse.dto';

@injectable()
export class SignInAdminUseCaseImpl implements ISignInAdminUseCase {
  constructor(
    @inject(TYPES.IAdminRepository) private adminRepository: IAdminRepository,
    @inject(TYPES.IHashService) private hashService: IHashService
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{ token: string; admin: AdminSignInResponseDTO }> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) {
      throw new Error('Admin not found');
    }

    const authMethodUsed = admin.authMethods.find(
      (authMethod) => authMethod.provider === 'credential'
    );

    if (!authMethodUsed?.passwordHash) {
      throw new Error('Credential based authentication method not found');
    }

    const isMatch = await this.hashService.compare(
      password,
      authMethodUsed?.passwordHash
    );
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = TokenService.generateToken(admin._id);

    return { token, admin: toAdminSignInResponseDTO(admin) };
  }
}
