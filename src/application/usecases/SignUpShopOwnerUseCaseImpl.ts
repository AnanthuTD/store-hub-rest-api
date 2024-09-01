// src/application/usecases/SignUpShopOwnerUseCaseImpl.ts
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/types';
import { ISignUpShopOwnerUseCase } from './SignUpShopOwnerUseCase';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import IPasswordHasher from '../../domain/services/IPasswordHasher';
import { IShopOwner } from '../../domain/entities/IShopOwner';

@injectable()
export class SignUpShopOwnerUseCaseImpl implements ISignUpShopOwnerUseCase {
  constructor(
    @inject(TYPES.IShopOwnerRepository)
    private shopOwnerRepository: IShopOwnerRepository,
    @inject(TYPES.PasswordHasher)
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(email: string, password: string): Promise<IShopOwner> {
    const existingUser = await this.shopOwnerRepository.findByEmail(email);

    if (existingUser) {
      throw new Error('Shop owner already exists');
    }

    const passwordHash = await this.passwordHasher.hashPassword(password);

    const shopOwner = await this.shopOwnerRepository.createWithCredential(
      email,
      passwordHash
    );

    if (!shopOwner) {
      throw new Error('Failed to create shop owner');
    }

    return shopOwner;
  }
}
