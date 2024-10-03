import { Server, Socket } from 'socket.io';

let markerPosition = { lat: 37.7749, lng: -122.4194 };

export const initializeVendorNamespace = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Vendor connected with socket ID:', socket.id);

    // Handle vendor joining specific room
    socket.on('joinStoreRoom', (storeId) => {
      socket.join(`store_${storeId}`); // Join room specific to the vendor
    });

    // Send the current marker position to the newly connected client
    socket.emit('markerMoved', markerPosition);

    // Listen for marker movement and broadcast to other clients
    socket.on('markerMoved', (position) => {
      markerPosition = position;
      io.emit('markerMoved', markerPosition); // Broadcast to all clients
    });

    socket.on('disconnect', () => {
      console.log('Vendor disconnected');
    });
  });
};
