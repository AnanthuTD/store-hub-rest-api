import admin from '../../config/firebase.config';

interface FCMMessage {
  data: { [key: string]: string };
  token: string;
}

class FCMService {
  async sendMessageToUser(
    fcmToken: string,
    message: FCMMessage
  ): Promise<void> {
    try {
      const notificationMessage = {
        data: message.data,
        token: fcmToken,
      };

      const response = await admin.messaging().send(notificationMessage);

      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending FCM message:', error);
      throw new Error('Failed to send FCM message');
    }
  }
}

export default new FCMService();
