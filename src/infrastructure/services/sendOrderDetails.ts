import { ObjectId } from 'mongoose';
import { io } from '../../socket';
import { IOrder } from '../database/models/OrderSchema';
import redisClient from '../redis/redisClient';
import { OrderRepository } from '../repositories/orderRepository';
import logger from '../utils/logger';
import { GoogleRoutesService } from './googleRoutes.service';

export async function sendOrderDetailsAndDirectionToDeliveryPartner({
  orderId,
  storeLongitude,
  storeLatitude,
}) {
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
        longitude: order.deliveryLocation.coordinates[0],
        latitude: order.deliveryLocation.coordinates[1],
      },
      waypoints: [
        {
          longitude: storeLongitude,
          latitude: storeLatitude,
        },
      ],
    });

    if (!direction) {
      logger.error(`No route found for order ${orderId}`);
      return;
    }

    io.of('/deliveryPartner')
      .to(`partner_${order.deliveryPartnerId}`)
      .emit('order-details', { direction, order });
  } catch (error) {
    logger.error(
      `Error sending order details to delivery partner for order ${orderId}:`,
      error
    );
  }
}

async function getDeliveryPartnerCurrentLocation(partnerId: string) {
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
