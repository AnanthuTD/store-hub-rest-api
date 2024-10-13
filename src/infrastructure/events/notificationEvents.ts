import eventEmitter from '../../eventEmitter/eventEmitter';
import fcmService, { FCMMessage } from '../services/fcmService';

interface Message {
  [key: string]: string;
}

export const emitNotification = (fcmToken: string, message: Message) => {
  eventEmitter.emit('sendNotification', { fcmToken, message });
};

eventEmitter.on(
  'sendNotification',
  async ({ fcmToken, message }: { fcmToken: string; message: Message }) => {
    const fcmMessage: FCMMessage = {
      data: message,
      token: fcmToken,
    };

    if (fcmToken && message) {
      await fcmService.sendMessageToUser(fcmMessage);
    }
  }
);
