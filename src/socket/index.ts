import { Server } from 'socket.io';
import { createServer } from 'node:http';
import app from '../app';
import { initializeStoreNamespace } from './store.socket';
import { initializeDeliveryPartnerNamespace } from './deliveryPartner.socket';
import { initializeOrderTrackingNamespace } from './orderTracking.socket';
import { initializeCallNamespace } from './call';
import { initializeChatWithAdminSocket } from './chat.socket';

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize namespaces
initializeStoreNamespace(io);
initializeDeliveryPartnerNamespace(io);
initializeOrderTrackingNamespace(io);

initializeCallNamespace(io);

initializeChatWithAdminSocket(io);

export { server, io };
