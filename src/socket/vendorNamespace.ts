import passport from 'passport';
import { Server, Socket } from 'socket.io';
import eventEmitter from '../eventEmitter/eventEmitter';

/**
 * Middleware for authenticating delivery partners using Passport
 */
const authenticate = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Unauthorized: No token provided'));
  }

  socket.request.headers['authorization'] = `Bearer ${token}`;

  passport.authenticate('shop-owner-jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return next(new Error('Unauthorized: Invalid token'));
    }
    socket.user = user;
    next();
  })(socket.request, {}, next);
};

/**
 * Initializes the delivery partner namespace with socket.io and handles events
 */
export const initializeVendorNamespace = (io: Server) => {
  const vendorNamespace = io.of('/vendor');

  vendorNamespace.use(authenticate);

  vendorNamespace.on('connection', (socket: Socket) => {
    console.log('Delivery Partner connected with socket ID:', socket.id);

    socket.join(socket.user._id?.toString());
    console.log(`Partner joined room: ${socket.user._id}`);

    // Handle order acceptance event

    socket.on('disconnect', () => {
      console.log('Delivery Partner disconnected');
    });
  });

  eventEmitter.on('subscription:status:update', (vendorId) => {
    console.log('emitting subscription status update to vendor: ', vendorId);

    vendorNamespace.to(vendorId).emit('subscription:status:update');
  });
};
