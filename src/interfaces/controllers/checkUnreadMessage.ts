import mongoose from 'mongoose';
import MessageModal from '../../infrastructure/database/models/MessageSchema';
import { getRequestUserId } from '../../infrastructure/utils/authUtils';

// Controller to check for unread messages
export const checkUnreadMessages = async (req, res) => {
  const userId = getRequestUserId(req);

  try {
    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find unread messages for the user as recipient
    const unreadMessages = await MessageModal.find({
      receiverId: userId,
      read: false,
    });

    console.log(unreadMessages);

    // Return true if there are unread messages, false otherwise
    return res.status(200).json({ hasUnread: unreadMessages.length > 0 });
  } catch (error) {
    console.error('Error checking unread messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
