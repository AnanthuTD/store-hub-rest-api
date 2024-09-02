import { inject, injectable } from 'inversify';
import { IDeliveryPartner } from '../../domain/entities/DeliveryPartner';
import { IDeliveryPartnerRepository } from '../../domain/repositories/IDeliveryPartnerRepository';
import { TYPES } from '../../config/types';

interface CreateDeliveryPartnerResponse {
  success: boolean;
  message: string;
  data?: Partial<IDeliveryPartner>;
}

@injectable()
class CreateDeliveryPartner {
  constructor(
    @inject(TYPES.DeliveryPartnerRepository)
    private deliveryPartnerRepository: IDeliveryPartnerRepository
  ) {}

  async execute(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<CreateDeliveryPartnerResponse> {
    // Save via repository
    try {
      const savedDeliveryPartner =
        await this.deliveryPartnerRepository.save(deliveryPartnerData);

      return {
        success: true,
        message: 'Delivery Partner created successfully',
        data: savedDeliveryPartner,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: `Error creating Delivery Partner: ${(error as Error).message}`,
      };
    }
  }
}

export default CreateDeliveryPartner;
