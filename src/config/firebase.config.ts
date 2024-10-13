import admin from 'firebase-admin';
import env from '../infrastructure/env/env';

export enum FCMRoles {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  DELIVERY_PARTNER = 'delivery_partner',
  USER = 'user',
}

admin.initializeApp({
  credential: admin.credential.cert(env.GOOGLE_APPLICATION_CREDENTIALS),
});

export default admin;
