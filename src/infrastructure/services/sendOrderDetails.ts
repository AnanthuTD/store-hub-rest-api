import { ObjectId } from 'mongoose';
import { IOrder } from '../database/models/OrderSchema';
import redisClient from '../redis/redisClient';
import { OrderRepository } from '../repositories/orderRepository';
import logger from '../utils/logger';
import { GoogleRoutesService } from './googleRoutes.service';
import DeliveryPartnerSocketService from './socketServices/deliveryPartnerSocketService';
// import { getDirections } from './testDirection.service';

export async function sendOrderDetailsAndDirectionToDeliveryPartner({
  orderId,
  storeLongitude,
  storeLatitude,
}) {
  logger.info('Sending order details to delivery partner');
  try {
    const orderRepository = new OrderRepository();

    const order = (await orderRepository.findOrderById(orderId)) as IOrder;

    const partnerLocation = await getDeliveryPartnerCurrentLocation(
      (order.deliveryPartnerId as ObjectId).toString()
    );

    if (!partnerLocation) {
      logger.error(
        `No location found for delivery partner ${order.deliveryPartnerId}`
      );
      return;
    }

    const routes = new GoogleRoutesService();
    const direction = await routes.fetchDirections({
      originLocation: {
        latitude: parseFloat(partnerLocation.latitude),
        longitude: parseFloat(partnerLocation.longitude),
      },
      destinationLocation: {
        longitude: storeLongitude,
        latitude: storeLatitude,
      },
    });

    /* const direction = await getDirections({
      originLocation:
        parseFloat(partnerLocation.latitude) +
        ',' +
        parseFloat(partnerLocation.longitude),

      destinationLocation: storeLatitude + ',' + storeLongitude,
    });
 */
    if (!direction) {
      logger.error(`No route found for order ${orderId}`);
      return;
    }

    new DeliveryPartnerSocketService().sendOrderDetails(
      (order.deliveryPartnerId as ObjectId).toString(),
      direction,
      order
    );
  } catch (error) {
    logger.error(
      `Error sending order details to delivery partner for order ${orderId}:`,
      error
    );
  }
}

export async function getDeliveryPartnerCurrentLocation(partnerId: string) {
  try {
    const location = await redisClient.geopos(
      'delivery-partner:location',
      partnerId
    );

    if (!location || !location[0]) {
      logger.error(`No location found for delivery partner ${partnerId}`);
      return null;
    }

    const [longitude, latitude] = location[0];
    return { latitude, longitude };
  } catch (error) {
    logger.error(
      `Error fetching delivery partner location for ${partnerId}:`,
      error
    );
    return null;
  }
}
