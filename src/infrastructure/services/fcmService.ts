import { Message } from 'firebase-admin/messaging';
import admin from '../../config/firebase.config';

class FCMService {
  async sendMessageToUser(message: Message): Promise<void> {
    try {
      const response = await admin.messaging().send(message);

      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending FCM message:', error);
    }
  }
}

export default new FCMService();
