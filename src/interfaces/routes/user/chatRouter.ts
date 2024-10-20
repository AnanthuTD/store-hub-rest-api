import express from 'express';
import ConversationModel from '../../../infrastructure/database/models/ConversationSchema';
import MessageModal from '../../../infrastructure/database/models/MessageSchema';
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

export default chatsRouter;
