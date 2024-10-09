import { ObjectId } from 'mongoose';
import DeliveryPartner from '../database/models/DeliveryPartner';
import Order, {
  OrderDeliveryStatus,
  IOrder,
} from '../database/models/OrderSchema';

interface AssignPartnerProps {
  partnerId: string;
  orderId: string;
  partnerName?: string;
}

export class OrderRepository {
  async assignPartner({ partnerId, orderId, partnerName }: AssignPartnerProps) {
    if (!partnerName) {
      const partner = await DeliveryPartner.findById(partnerId)
        .select(['firstName', 'lastName'])
        .lean();

      if (!partner) {
        throw new Error('Partner not found');
      }
      partnerName = partner.firstName + ' ' + partner.lastName;
    }

    await Order.findByIdAndUpdate(orderId, {
      deliveryPartnerId: partnerId,
      partnerName,
      deliveryStatus: OrderDeliveryStatus.Assigned,
    });

    return true;
  }

  async findOrderById(orderId: string | ObjectId): Promise<IOrder | null> {
    return Order.findById(orderId);
  }
}
