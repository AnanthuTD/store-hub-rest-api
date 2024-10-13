import admin from '../../config/firebase.config';

export interface FCMMessage {
  data: { [key: string]: string };
  token: string;
}

class FCMService {
  async sendMessageToUser(payload: FCMMessage): Promise<void> {
    try {
      const response = await admin.messaging().send(payload);

      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending FCM message:', error);
      throw new Error('Failed to send FCM message');
    }
  }
}

export default new FCMService();
