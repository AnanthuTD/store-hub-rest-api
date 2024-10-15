import { Server, Socket } from 'socket.io';
import { addDeliveryPartner } from '../infrastructure/services/addDeliveryPartnerGeoService';
import redisClient from '../infrastructure/redis/redisClient';
import Order from '../infrastructure/database/models/OrderSchema';

export const initializeOrderTrackingNamespace = (io: Server) => {
  const orderTrackingNamespace = io.of('/track');

  orderTrackingNamespace.on('connection', (socket: Socket) => {
    console.log('Order Tracking connected with socket ID:', socket.id);

    socket.on('track:order', async (orderId: string) => {
      socket.join(orderId);
      const order = await Order.findById(orderId, { deliveryPartnerId: 1 });
      const location = await redisClient.geopos(
        'delivery-partner:location',
        order?.deliveryPartnerId?.toString()
      );

      if (location && location.length && location[0]) {
        socket.to(orderId).emit('location:update', {
          location: {
            lng: Number.parseFloat(location[0][0]),
            lat: Number.parseFloat(location[0][1]),
          },
        });
      }
    });

    socket.on(
      'emit:location',
      (data: {
        location: { lat: number; lng: number };
        orderId: string;
        duration: number;
        polyline: string;
        distance: number;
        partnerId: string;
      }) => {
        console.log(data.location, data.partnerId);

        addDeliveryPartner({
          latitude: data.location?.lat,
          longitude: data.location?.lng,
          deliveryPartnerId: data?.partnerId,
        }).then((response) => console.log(response));

        socket.to(data.orderId).emit('location:update', data);
      }
    );
  });
};
