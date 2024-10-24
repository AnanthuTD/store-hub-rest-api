import passport from 'passport';
import { Server, Socket } from 'socket.io';
import eventEmitter from '../eventEmitter/eventEmitter';

export const initializeAdminSocket = (io: Server) => {
  const adminNamespace = io.of('/admin');

  // Authentication middleware to ensure socket has user info
  adminNamespace.use(authenticate);

  adminNamespace.on('connection', (socket: Socket) => {
    const adminId = socket.user._id;

    socket.join(adminId.toString());
  });

  eventEmitter.on('admin:new:chat', (adminId: string) => {
    adminNamespace.to(adminId).emit('new:chat');
  });

  eventEmitter.on('admin:new:notification', (adminId: string) => {
    adminNamespace.to(adminId).emit('new:notification');
  });
};

/**
 * Middleware for authenticating delivery partners using Passport
 */
const authenticate = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Unauthorized: No token provided'));
  }

  socket.request.headers['authorization'] = `Bearer ${token}`;

  passport.authenticate('admin-jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return next(new Error('Unauthorized: Invalid token'));
    }
    socket.user = user;
    next();
  })(socket.request, {}, next);
};
