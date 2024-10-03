import passport from 'passport';
import { Server, Socket } from 'socket.io';

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

    const cookies = socket.request.headers.cookies;
    console.log('Cookies:', cookies);

    socket.on('accept', (order) => {
      console.log('New order received by delivery partner:', order);
    });

    socket.on('locationUpdate', (location) => {
      console.log(`Delivery Partner location updated: ${location}`);
      deliveryPartnerNamespace.emit('locationBroadcast', location); // Broadcast to all in the namespace
    });

    socket.on('disconnect', () => {
      console.log('Delivery Partner disconnected');
    });
  });
};
