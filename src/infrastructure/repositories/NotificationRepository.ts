import { ObjectId } from 'mongoose';
import Notification, {
  INotification,
  NotificationType,
  // RecipientType,
} from '../database/models/NotificationModel';

class NotificationRepository {
  // Create a new notification
  async createNotification(
    recipientId: string | ObjectId,
    // role: RecipientType,
    type: NotificationType,
    message: string
  ): Promise<INotification> {
    const notification = new Notification({
      recipientId,
      // role,
      type,
      message,
      readStatus: false, // Default to unread
    });
    return await notification.save();
  }

  // Fetch notifications for a specific recipient (with optional pagination)
  async getNotifications(
    recipientId: string,
    // role: RecipientType,
    limit = 10,
    skip = 0
  ): Promise<{ notifications: INotification[]; total: number }> {
    try {
      // Fetch notifications with pagination
      const notifications = await Notification.find({ recipientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      // Count total notifications for pagination
      const total = await Notification.countDocuments({
        recipientId,
      }).exec();

      return { notifications, total }; // Return both notifications and total count
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications'); // Handle error appropriately
    }
  }

  // Mark a specific notification as read
  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { readStatus: true },
      { new: true }
    ).exec();
  }

  // Delete a specific notification
  async deleteNotification(notificationId: string): Promise<void> {
    await Notification.findByIdAndDelete(notificationId).exec();
  }

  // Mark all notifications as read for a recipient
  async markAllAsRead(
    recipientId: string /* , role: RecipientType */
  ): Promise<void> {
    await Notification.updateMany(
      { recipientId, /* role, */ readStatus: false },
      { $set: { readStatus: true } }
    ).exec();
  }

  // Delete all notifications for a specific recipient
  async deleteAllNotifications(
    recipientId: string
    // role: RecipientType
  ): Promise<void> {
    await Notification.deleteMany({ recipientId /* , role */ }).exec();
  }
}

export default NotificationRepository;
