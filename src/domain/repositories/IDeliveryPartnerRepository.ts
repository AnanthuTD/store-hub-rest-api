import { IDeliveryPartner } from '../entities/DeliveryPartner';

export interface IDeliveryPartnerRepository {
  save(
    deliveryPartner: Partial<IDeliveryPartner>
  ): Promise<Partial<IDeliveryPartner>>;

  update(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<IDeliveryPartner>;
}
