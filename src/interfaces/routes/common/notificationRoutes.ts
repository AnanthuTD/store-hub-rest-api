import express from 'express';
import NotificationController from '../../controllers/NotificationController';
const notificationRouter = express.Router();

const notificationController = new NotificationController();

notificationRouter.get(
  '/',
  notificationController.getNotifications.bind(notificationController)
);
notificationRouter.patch(
  '/:notificationId/read',
  notificationController.markAsRead.bind(notificationController)
);
notificationRouter.patch(
  '/read-all',
  notificationController.markAllAsRead.bind(notificationController)
);
notificationRouter.delete(
  '/:notificationId',
  notificationController.deleteNotification.bind(notificationController)
);
notificationRouter.delete(
  '/',
  notificationController.deleteAllNotifications.bind(notificationController)
);

export default notificationRouter;
