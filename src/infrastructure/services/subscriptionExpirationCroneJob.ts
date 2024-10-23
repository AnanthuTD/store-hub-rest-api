import cron from 'node-cron';
import EmailService from './EmailService';
import VendorSubscriptionModel, {
  SubscriptionStatus,
} from '../database/models/VendorSubscriptionModal';
import { IShopOwner } from '../../domain/entities/IShopOwner';
import NotificationRepository from '../repositories/NotificationRepository';
import { NotificationType } from '../database/models/NotificationModel';

const emailService = new EmailService();

// Centralized cron job that runs daily
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily subscription expiration check...');

    // Find subscriptions that expire tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringSubscriptions = await VendorSubscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
      endDate: { $lte: tomorrow },
    });

    // Send emails for each expiring subscription
    for (const subscription of expiringSubscriptions) {
      const vendor: {
        vendorId: IShopOwner;
      } = await subscription.populate('vendorId');

      if (!vendor || !vendor.vendorId.email) {
        console.log(
          `No valid vendor or email found for subscription: ${subscription._id}`
        );
        continue;
      }

      const notificationRepo = new NotificationRepository();
      notificationRepo.createNotification(
        vendor.vendorId._id,
        NotificationType.SUBSCRIPTION_EXPIRATION,
        `Your subscription with ID ${subscription._id} is set to expire on ${subscription.endDate.toDateString()}.
        Please renew your subscription to continue enjoying our services.`
      );

      const emailContent = `
        <h1>Subscription Expiration Notice</h1>
        <p>Dear ${vendor.vendorId.profile?.name},</p>
        <p>Your subscription with ID <strong>${subscription._id}</strong> is set to expire on ${subscription.endDate.toDateString()}.</p>
        <p>Please renew your subscription to continue enjoying our services.</p>
      `;

      await emailService.sendVerificationEmail({
        to: vendor.vendorId.email,
        subject: 'Your Subscription is Expiring Soon',
        html: emailContent,
      });

      console.log(
        `Sent expiration email to ${vendor.vendorId.email} for subscription ${subscription._id}`
      );
    }
  } catch (error) {
    console.error('Error in the cron job:', error);
  }
});
