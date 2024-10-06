import passport from 'passport';
import { Server, Socket } from 'socket.io';
import eventEmitter from '../eventEmitter/eventEmitter';
import { addDeliveryPartner } from '../infrastructure/services/addDeliveryPartnerGeoService';
import socketKeys from './socketKeys';
import eventEmitterEventNames from '../eventEmitter/eventNames';

/**
 * Middleware for authenticating delivery partners using Passport
 */
const authenticateDeliveryPartner = (
  socket: Socket,
  next: (err?: Error) => void
) => {
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
};

/**
 * Handles order acceptance events from delivery partners
 */
const handleOrderAcceptance = (socket: Socket) => (orderId: string) => {
  console.log('New order received by delivery partner:', socket.user._id);

  const event = eventEmitterEventNames.getOrderAcceptanceEventName(
    orderId,
    socket.user._id
  );
  eventEmitter.emit(event, socket.user);
};

/**
 * Handles location updates from delivery partners
 */
const handleLocationUpdate =
  (socket: Socket) => (location: { latitude: number; longitude: number }) => {
    console.log(`Delivery Partner location updated: `, location);

    addDeliveryPartner({
      latitude: location.latitude,
      longitude: location.longitude,
      deliveryPartnerId: socket.user._id,
    }).then((response) => console.log(response));
  };

let markerPosition = { lat: 37.7749, lng: -122.4194 }; // Default marker position

/**
 * Initializes the delivery partner namespace with socket.io and handles events
 */
export const initializeDeliveryPartnerNamespace = (io: Server) => {
  const deliveryPartnerNamespace = io.of(socketKeys.deliveryPartnerNameSpace);

  deliveryPartnerNamespace.use(authenticateDeliveryPartner);

  deliveryPartnerNamespace.on('connection', (socket: Socket) => {
    console.log('Delivery Partner connected with socket ID:', socket.id);

    const roomId = socketKeys.getPartnerRoomKey(socket.user._id);
    socket.join(roomId);
    console.log(`Partner joined room: ${roomId}`);

    // Handle order acceptance event
    socket.on(
      socketKeys.getOrderAcceptanceEvent(),
      handleOrderAcceptance(socket)
    );

    // Handle location update event
    socket.on(
      socketKeys.getLocationUpdateEvent(),
      handleLocationUpdate(socket)
    );

    // Send the current marker position to the newly connected client
    socket.emit('markerMoved', markerPosition);

    // Listen for marker movement and broadcast to other clients
    socket.on('markerMoved', (position) => {
      markerPosition = position;
      socket.emit('markerMoved', markerPosition); // Broadcast to all clients in the vendor namespace
    });

    socket.on('disconnect', () => {
      console.log('Delivery Partner disconnected');
    });
  });
};
