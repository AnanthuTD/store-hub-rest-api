import { IShopOwner } from '../entities/IShopOwner';

export interface IShopOwnerRepository {
  findByEmail(email: string): Promise<IShopOwner | null>;
  createWithCredential(
    email: string,
    passwordHash: string
  ): Promise<IShopOwner | null>;
}
