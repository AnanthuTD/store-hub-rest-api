import express from 'express';
import ConversationModel from '../../../infrastructure/database/models/ConversationSchema';
import MessageModal from '../../../infrastructure/database/models/MessageSchema';
import { checkUnreadMessages } from '../../controllers/checkUnreadMessage';
import { markMessagesAsRead } from '../../controllers/markChatsAsRead';
const chatsRouter = express.Router();

chatsRouter.get('/:receiverId', async (req, res) => {
  const { receiverId } = req.params;
  const userId = req.user._id;

  const conversation = await ConversationModel.findOne({
    participants: { $all: [receiverId, userId] },
  });

  if (!conversation) return res.json([]);

  const messages = await MessageModal.find({
    conversationId: conversation._id,
  });

  res.json(messages);
});

chatsRouter.get('/unread-messages', checkUnreadMessages);

chatsRouter.put('/mark-as-read/:conversationId', markMessagesAsRead);

export default chatsRouter;
