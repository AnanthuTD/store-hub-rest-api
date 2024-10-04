import passport from 'passport';
import { Server, Socket } from 'socket.io';
import eventEmitter from './eventEmitter';
import { addDeliveryPartner } from '../infrastructure/services/addDeliveryPartnerGeoService';

export const initializeDeliveryPartnerNamespace = (io: Server) => {
  const deliveryPartnerNamespace = io.of('/deliveryPartner');

  deliveryPartnerNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Unauthorized: No token provided'));
    }

    socket.request.headers['authorization'] = `Bearer ${token}`;

    passport.authenticate('partner-jwt', { session: false }, (err, user) => {
      if (err || !user) {
        return next(new Error('Unauthorized: Invalid token'));
      }
      socket.user = user;
      next();
    })(socket.request, {}, next);
  });

  deliveryPartnerNamespace.on('connection', (socket: Socket) => {
    console.log('Delivery Partner connected with socket ID:', socket.id);

    const roomId = `partner_${socket.user._id}`;
    socket.join(roomId);
    console.log(`Partner joined room: ${roomId}`);

    // Listen for order acceptance
    socket.on('accept', (orderId) => {
      console.log('New order received by delivery partner:', socket.user._id);

      const event = `accepted:${orderId}:${socket.user._id}`;

      eventEmitter.emit(event, socket.user);

      // Inform all other partners in this room that they can no longer accept this order
      // socket.to(roomId).emit('order-accepted', { orderId: order.orderId });
    });

    // Listen for location updates
    socket.on('locationUpdate', (location) => {
      console.log(`Delivery Partner location updated: `, location);
      addDeliveryPartner({
        latitude: location.latitude,
        longitude: location.longitude,
        deliveryPartnerId: socket.user._id,
      }).then((response) => console.log(response));
    });

    socket.on('disconnect', () => {
      console.log('Delivery Partner disconnected');
    });
  });
};
