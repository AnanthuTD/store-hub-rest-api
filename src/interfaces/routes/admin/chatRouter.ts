import express from 'express';
import ConversationModel from '../../../infrastructure/database/models/ConversationSchema';
import MessageModal from '../../../infrastructure/database/models/MessageSchema';
import { checkUnreadMessages } from '../../controllers/checkUnreadMessage';
import { markMessagesAsRead } from '../../controllers/markChatsAsRead';
const chatsRouter = express.Router();

chatsRouter.get('/conversations', async (req, res) => {
  const userId = req.user._id;

  const conversations = await ConversationModel.find({
    participants: { $in: [userId] },
  });

  res.json(conversations);
});

chatsRouter.get('/:conversationId/conversation', async (req, res) => {
  const { conversationId } = req.params;
  // const userId = req.user._id;

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
