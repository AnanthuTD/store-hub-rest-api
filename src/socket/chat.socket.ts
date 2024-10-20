import { Server, Socket } from 'socket.io';
import logger from '../infrastructure/utils/logger';
import ConversationModel from '../infrastructure/database/models/ConversationSchema';
import MessageModal from '../infrastructure/database/models/MessageSchema';

export const initializeChatWithAdminSocket = (io: Server) => {
  const chatWithAdminNamespace = io.of('/adminChat');

  // Authentication middleware to ensure socket has user info
  chatWithAdminNamespace.use(authenticate);

  chatWithAdminNamespace.on('connection', (socket: Socket) => {
    let userId: string;
    let conversationId: string;
    let receiverId: string;

    // Event to initiate the conversation between two users
    socket.on('initiate', async (senderId: string, receiverIdParam: string) => {
      try {
        userId = senderId;
        receiverId = receiverIdParam;

        // Find or create conversation between sender and receiver
        let conversation = await ConversationModel.findOne({
          participants: { $all: [receiverId, userId] },
        });

        if (!conversation) {
          conversation = new ConversationModel({
            participants: [receiverId, userId],
          });
          await conversation.save();
        }

        conversationId = conversation._id.toString();

        // Join the room corresponding to this conversation
        socket.join(conversationId);

        logger.info(`User ${userId} joined room ${conversationId}`);
      } catch (error) {
        logger.error('Error initiating conversation:', error);
        socket.emit('error', 'Failed to initiate conversation');
      }
    });

    // Event to handle sending a message
    socket.on('sendMessage', async (data: { message: string }) => {
      try {
        if (!conversationId || !userId || !receiverId) {
          socket.emit('error', 'Conversation not initiated');
          return;
        }

        // Create and save the message
        const message = await MessageModal.create({
          content: data.message,
          conversationId,
          senderId: userId,
          receiverId,
        });

        await message.save();

        console.log(message);

        // Emit the message to all clients in the conversation room
        chatWithAdminNamespace.to(conversationId).emit('message', message);

        logger.info(
          `Message sent from ${userId} to ${receiverId} in room ${conversationId}`
        );
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });
  });
};

// Middleware to authenticate the user (this is just an example, add real authentication logic)
const authenticate = (socket: Socket, next: (err?: Error) => void) => {
  try {
    next();
  } catch (err) {
    logger.error('Authentication failed:', err);
    next(new Error('Authentication failed'));
  }
};
