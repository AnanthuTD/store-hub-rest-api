import { Server } from 'socket.io';
import { createServer } from 'node:http';
import app from '../app';
import { initializeVendorNamespace } from './vendor';
import { initializeDeliveryPartnerNamespace } from './deliveryPartner.socket';

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize namespaces
initializeVendorNamespace(io);
initializeDeliveryPartnerNamespace(io);

export { server, io };
