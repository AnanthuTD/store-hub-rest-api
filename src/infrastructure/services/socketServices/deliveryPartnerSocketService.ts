import { io } from '../../../socket';
import socketKeys from '../../../socket/socketKeys';

class DeliveryPartnerSocketService {
  private deliveryPartnerNamespace = io.of(socketKeys.deliveryPartnerNameSpace);

  sendOrderAlert(
    partnerId: string,
    orderId: string,
    timeout: number,
    distance: number
  ) {
    this.deliveryPartnerNamespace
      .to(socketKeys.getPartnerRoomKey(partnerId))
      .emit(socketKeys.orderAlertEvent, {
        orderId,
        timeout,
        distance,
      });
  }

  removeOrderAlert(partnerId: string, orderId: string) {
    this.deliveryPartnerNamespace
      .to(socketKeys.getPartnerRoomKey(partnerId))
      .emit(socketKeys.orderAlertRemovedEvent, {
        orderId,
        message: 'Order has been accepted by another delivery partner.',
      });
  }

  sendOrderDetails(partnerId: string, direction: string, order: any) {
    this.deliveryPartnerNamespace
      .to(socketKeys.getPartnerRoomKey(partnerId))
      .emit(socketKeys.orderDetailsEvent, { direction, order });
  }
}

export default new DeliveryPartnerSocketService();
