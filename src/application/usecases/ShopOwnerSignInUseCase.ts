// src/application/usecases/SignInAdminUseCaseImpl.ts
import { injectable, inject } from 'inversify';
import { IHashService } from '../../domain/services/IHashService';
import { TYPES } from '../../config/types';
import TokenService from '../../infrastructure/services/TokenService';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import {
  ShopOwnerResponseDTO,
  toShopOwnerSignInResponseDTO,
} from '../dto/shopOwnerResponse.dto';

@injectable()
export class SignInShopOwnerUseCase {
  constructor(
    @inject(TYPES.IShopOwnerRepository)
    private shopOwnerRepository: IShopOwnerRepository,
    @inject(TYPES.IHashService) private hashService: IHashService
  ) {}

  async execute(
    email: string,
    password: string
  ): Promise<{ token: string; shopOwner: ShopOwnerResponseDTO }> {
    const shopOwner = await this.shopOwnerRepository.findByEmail(email);
    if (!shopOwner) {
      throw new Error('ShopOwner not found');
    }

    if (!shopOwner.emailVerified) {
      throw new Error('Email not verified! verify to login');
    }

    const authMethodUsed = shopOwner.authMethods.find(
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

    const token = TokenService.generateToken(shopOwner._id);

    return { token, shopOwner: toShopOwnerSignInResponseDTO(shopOwner) };
  }
}
