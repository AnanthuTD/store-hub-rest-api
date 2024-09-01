import { IShopOwner } from '../../domain/entities/IShopOwner';

export interface ISignUpShopOwnerUseCase {
  execute(email: string, password: string): Promise<IShopOwner>;
}
