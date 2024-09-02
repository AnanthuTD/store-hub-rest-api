import { inject, injectable } from 'inversify';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';
import { TYPES } from '../../config/types';
import { IShopOwner } from '../../domain/entities/IShopOwner';

@injectable()
class UpdateShopOwnerUseCase {
  constructor(
    @inject(TYPES.IShopOwnerRepository)
    private shopOwnerRepository: IShopOwnerRepository
  ) {}

  public async execute(
    id: string,
    updatedData: Partial<IShopOwner>
  ): Promise<void> {
    const existingShopOwner = await this.shopOwnerRepository.findById(id);

    if (!existingShopOwner) {
      throw new Error('ShopOwner not found');
    }

    // You can merge existing data with updated data, if needed
    const updatedShopOwner = { ...existingShopOwner, ...updatedData };

    await this.shopOwnerRepository.update(id, updatedShopOwner);
  }
}

export { UpdateShopOwnerUseCase };
