import { Request, Response } from 'express';
import NotificationRepository from '../../infrastructure/repositories/NotificationRepository';

class NotificationController {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  // Create a new notification (for testing purposes, usually system-generated)
  async createNotification(req: Request, res: Response) {
    const { role, type, message } = req.body;
    const recipientId = req.user._id; // Extracting from authenticated user

    try {
      const notification = await this.notificationRepo.createNotification(
        recipientId,
        role,
        type,
        message
      );
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create notification', error });
    }
  }

  // Fetch notifications for a specific recipient (Admin, Vendor, etc.)
  async getNotifications(req: Request, res: Response) {
    const recipientId = req.user._id; // Extracting from authenticated user
    // const role = req.user.role; // Extracting role from user (assuming it's stored in the user object)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10; // Allowing dynamic limit
    const skip = (page - 1) * limit;

    try {
      // Fetching notifications
      const { notifications, total } =
        await this.notificationRepo.getNotifications(
          recipientId,
          // role as RecipientType,
          limit,
          skip
        );

      // Sending back structured response
      res.status(200).json({
        notifications, // The notifications array
        total, // Total count of notifications for pagination
        page, // Current page
        limit, // Limit per page
        totalPages: Math.ceil(total / limit), // Total number of pages
      });
    } catch (error) {
      console.error(error);

      // Handle error and send back structured error response
      res.status(500).json({
        message: 'Failed to fetch notifications',
        error: error.message,
      });
    }
  }

  // Mark a notification as read
  async markAsRead(req: Request, res: Response) {
    const { notificationId } = req.params;

    try {
      const notification =
        await this.notificationRepo.markAsRead(notificationId);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      console.log(notification);
      res.status(200).json(notification);
    } catch (error) {
      console.error(error);

      res
        .status(500)
        .json({ message: 'Failed to mark notification as read', error });
    }
  }

  // Mark all notifications as read for a recipient
  async markAllAsRead(req: Request, res: Response) {
    const recipientId = req.user._id; // Extracting from authenticated user
    // const role = req.user.role; // Extracting role from user

    try {
      await this.notificationRepo.markAllAsRead(
        recipientId
        // role as RecipientType
      );
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to mark all notifications as read', error });
    }
  }

  // Delete a specific notification
  async deleteNotification(req: Request, res: Response) {
    const { notificationId } = req.params;

    try {
      await this.notificationRepo.deleteNotification(notificationId);
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete notification', error });
    }
  }

  // Delete all notifications for a specific recipient
  async deleteAllNotifications(req: Request, res: Response) {
    const recipientId = req.user._id; // Extracting from authenticated user
    // const role = req.user.role; // Extracting role from user

    try {
      await this.notificationRepo.deleteAllNotifications(
        recipientId
        // role as RecipientType
      );
      res
        .status(200)
        .json({ message: 'All notifications deleted successfully' });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to delete all notifications', error });
    }
  }
}

export default NotificationController;
