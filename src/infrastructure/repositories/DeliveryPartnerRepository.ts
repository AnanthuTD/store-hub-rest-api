import { injectable } from 'inversify';
import { IDeliveryPartner } from '../../domain/entities/DeliveryPartner';
import { IDeliveryPartnerRepository } from '../../domain/repositories/IDeliveryPartnerRepository';
import DeliveryPartner from '../database/models/DeliveryPartner';

@injectable()
export class DeliveryPartnerRepository implements IDeliveryPartnerRepository {
  async save(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<IDeliveryPartner> {
    const deliveryPartner = new DeliveryPartner(deliveryPartnerData);
    return await deliveryPartner.save();
  }
}
