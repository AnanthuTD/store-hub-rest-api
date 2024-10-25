import express from 'express';
import ConversationModel from '../../../infrastructure/database/models/ConversationSchema';
import MessageModal from '../../../infrastructure/database/models/MessageSchema';
import { checkUnreadMessages } from '../../controllers/checkUnreadMessage';
import { markMessagesAsRead } from '../../controllers/markChatsAsRead';
import { User } from '../../../infrastructure/database/models/UserSchema';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';
const chatsRouter = express.Router();

chatsRouter.get('/conversations', async (req, res) => {
  const userId = getRequestUserId(req);

  const conversations = await ConversationModel.find({
    participants: { $in: [userId] },
  }).lean();

  const data = await Promise.all(
    conversations.map(async (conversation) => {
      // Find the other participant by filtering out the current user
      const otherParticipantId = conversation.participants.find(
        (participant) => participant?.toString() !== userId.toString()
      );

      // Fetch user details for the other participant
      if (otherParticipantId) {
        const user = await User.findById(otherParticipantId);

        if (user) {
          return {
            ...conversation,
            name: user.profile?.firstName || 'Unknown', // Handle undefined profile name
          };
        }
      }

      // Return null or an empty object if user not found or no other participant
      return null;
    })
  );

  // Filter out any null values from the results
  const filteredData = data.filter(Boolean); // This removes all null entries

  // Now `filteredData` contains the conversations with user details

  res.json(filteredData);
});

chatsRouter.get('/:conversationId/conversation', async (req, res) => {
  const { conversationId } = req.params;
  // const userId = getRequestUserId(req);

  /*  const conversation = await ConversationModel.findOne({
    participants: { $all: [receiverId, userId] },
  }); */

  if (!conversationId) return res.json([]);

  const messages = await MessageModal.find({
    conversationId,
  });

  res.json(messages);
});

chatsRouter.get('/unread-messages', checkUnreadMessages);

chatsRouter.put('/mark-as-read/:conversationId', markMessagesAsRead);

export default chatsRouter;
