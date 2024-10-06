import passport from 'passport';
import { Server, Socket } from 'socket.io';
import socketKeys from './socketKeys';

export const initializeStoreNamespace = (io: Server) => {
  const vendorNamespace = io.of(socketKeys.storeNameSpace);

  // Use authentication middleware for this namespace
  vendorNamespace.use(authenticate);

  vendorNamespace.on('connection', (socket: Socket) => {
    console.log(`Store connected with socket ID: ${socket.id}`);

    // Generate a dynamic room ID for the store
    const roomId = socketKeys.getStoreRoomKey(socket.user._id);
    socket.join(roomId);

    console.log(`Store joined room: ${roomId}`);

    socket.on('disconnect', () => {
      console.log(`Store disconnected with socket ID: ${socket.id}`);
    });
  });
};

/**
 * Middleware for authenticating vendor using Passport
 */
const authenticate = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Unauthorized: No token provided'));
  }

  socket.request.headers['authorization'] = `Bearer ${token}`;

  passport.authenticate('vendor-jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return next(new Error('Unauthorized: Invalid token'));
    }
    socket.user = user;
    next();
  })(socket.request, {}, next);
};
