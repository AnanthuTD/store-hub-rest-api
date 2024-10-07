import { Server, Socket } from 'socket.io';

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
        location;
        orderId: string;
        duration: number;
        polyline: string;
        distance: number;
      }) => {
        socket.to(data.orderId).emit('location:update', data);
      }
    );
  });
};
