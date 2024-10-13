import { Message } from 'firebase-admin/messaging';
import eventEmitter from '../../eventEmitter/eventEmitter';
import fcmService from '../services/fcmService';

export const emitNotification = (message: Message) => {
  eventEmitter.emit('sendNotification', message);
};

eventEmitter.on('sendNotification', async (message: Message) => {
  if (message) {
    await fcmService.sendMessageToUser(message);
  }
});
