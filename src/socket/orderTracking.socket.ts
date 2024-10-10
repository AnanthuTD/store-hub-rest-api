import { Server, Socket } from 'socket.io';
import { addDeliveryPartner } from '../infrastructure/services/addDeliveryPartnerGeoService';

export const initializeOrderTrackingNamespace = (io: Server) => {
  const orderTrackingNamespace = io.of('/track');

  orderTrackingNamespace.on('connection', (socket: Socket) => {
    console.log('Order Tracking connected with socket ID:', socket.id);

    socket.on('track:order', (orderId: string) => {
      socket.join(orderId);
    });

    socket.on(
      'emit:location',
      (data: {
        location: { latitude: number; longitude: number };
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
