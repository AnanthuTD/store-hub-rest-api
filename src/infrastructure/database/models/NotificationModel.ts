import { Schema, model, Document } from 'mongoose';

// Enum for notification types
export enum NotificationType {
  SUBSCRIPTION_EXPIRATION = 'subscription_expiration',
  ORDER_PLACED = 'order_placed',
  DELIVERY_UPDATE = 'delivery_update',
  GENERAL_ANNOUNCEMENT = 'general_announcement',
}

// Enum for recipient roles
export enum RecipientType {
  ADMIN = 'admin',
  VENDOR = 'vendor',
  DELIVERY_PARTNER = 'delivery_partner',
  USER = 'user',
}

export interface INotification extends Document {
  recipientId: Schema.Types.ObjectId; // Reference to the recipient (Admin, Vendor, etc.)
  role: RecipientType; // Role of the recipient (Admin, Vendor, etc.)
  type: NotificationType; // Type of notification (order placed, etc.)
  message: string; // Notification message
  readStatus: boolean; // Whether the notification has been read
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last updated timestamp
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'role',
    },
    role: {
      type: String,
      enum: Object.values(RecipientType),
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    message: { type: String, required: true },
    readStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = model<INotification>('Notification', NotificationSchema);

export default Notification;
