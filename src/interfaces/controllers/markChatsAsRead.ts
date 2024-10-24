import mongoose from 'mongoose';
import MessageModal from '../../infrastructure/database/models/MessageSchema';
import eventEmitter from '../../eventEmitter/eventEmitter';

// Controller to mark messages as read in a conversation
export const markMessagesAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    // Validate conversationId
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }

    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Update messages in the specified conversation to mark them as read
    await MessageModal.updateMany(
      {
        conversationId: conversationId,
        receiverId: userId,
        read: false, // Only update unread messages
      },
      {
        $set: { read: true }, // Set read status to true
      }
    );

    eventEmitter.emit('newChatMessage', userId);

    // Return a success response
    return res
      .status(200)
      .json({ message: 'Messages marked as read successfully' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
