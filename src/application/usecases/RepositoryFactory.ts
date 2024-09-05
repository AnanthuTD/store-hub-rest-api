import { inject, injectable } from 'inversify';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { TYPES } from '../../config/types';
import { UserRole } from '../../domain/entities/roles';
import { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import { IDeliveryPartnerRepository } from '../../domain/repositories/IDeliveryPartnerRepository';
import { IShopOwnerRepository } from '../../domain/repositories/IShopOwnerRepository';

@injectable()
class RepositoryFactory {
  private repositories: {
    user: IUserRepository;
    admin: IAdminRepository;
    deliveryPartner: IDeliveryPartnerRepository;
    shopOwner: IShopOwnerRepository;
  };

  public constructor(
    @inject(TYPES.UserRepository) userRepo: IUserRepository,
    @inject(TYPES.IAdminRepository) adminRepo: IAdminRepository,
    @inject(TYPES.DeliveryPartnerRepository)
    deliveryPartnerRepo: IDeliveryPartnerRepository,
    @inject(TYPES.IShopOwnerRepository) shopOwnerRepo: IShopOwnerRepository
  ) {
    this.repositories = {
      user: userRepo,
      admin: adminRepo,
      deliveryPartner: deliveryPartnerRepo,
      shopOwner: shopOwnerRepo,
    };
  }

  public getRepository(role: UserRole) {
    const repo = this.repositories[role];
    if (!repo) {
      throw new Error(`No repository found for role: ${role}`);
    }
    return repo;
  }
}

export default RepositoryFactory;
