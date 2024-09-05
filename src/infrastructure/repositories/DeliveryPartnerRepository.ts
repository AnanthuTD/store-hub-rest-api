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

  async getUserByMobile(phone: string): Promise<IDeliveryPartner | null> {
    return DeliveryPartner.findOne({ phone });
  }

  async update(
    deliveryPartnerData: Partial<IDeliveryPartner>
  ): Promise<IDeliveryPartner> {
    const { _id, ...updateData } = deliveryPartnerData;

    const upsertedPartner = await DeliveryPartner.findOneAndUpdate(
      { _id }, // Match by _id
      { $set: updateData }, // Set the fields that need to be updated
      { new: true, upsert: true, useFindAndModify: false } // Options: return the new document, create if not exists
    )
      .lean()
      .exec();

    return upsertedPartner as IDeliveryPartner;
  }

  async getNotVerified() {
    return DeliveryPartner.find({ isVerified: false });
  }

  async getById(id: string): Promise<IDeliveryPartner | null> {
    return DeliveryPartner.findById(id).lean().exec();
  }
}
