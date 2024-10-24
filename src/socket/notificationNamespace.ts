import { Server, Socket } from 'socket.io';
import eventEmitter from '../eventEmitter/eventEmitter';

const notificationEmitter = eventEmitter;

// Initialize a simple notification/chat room where users join with their userId
export const initializeNotificationNamespace = (io: Server) => {
  const notificationNamespace = io.of('/notifications');

  notificationNamespace.on('connection', (socket: Socket) => {
    console.log('User connected to notifications namespace');

    // Listen for "join" event to join a room by userId
    socket.on('join', (userId: string) => {
      console.log(`User with ID ${userId} joined their notification room.`);
      socket.join(userId); // The user joins a room named after their userId
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('User disconnected from notifications namespace');
    });
  });

  // Listen for new notification events and emit them to the userId's room
  notificationEmitter.on(
    'newNotification',
    (userId: string, message: string = '') => {
      console.log(`Sending new notification to user ${userId}: ${message}`);
      notificationNamespace.to(userId).emit('notification', message);
    }
  );

  // Listen for new chat message events and emit them to the userId's room
  notificationEmitter.on(
    'newChatMessage',
    (userId: string, chatMessage: string = '') => {
      console.log(`Sending new chat message to user ${userId}: ${chatMessage}`);
      notificationNamespace.to(userId).emit('chatMessage', chatMessage);
    }
  );
};
