import { Message } from 'firebase-admin/messaging';
import { FCMRoles } from '../../config/firebase.config';
import eventEmitter from '../../eventEmitter/eventEmitter';
import Order, {
  OrderDeliveryStatus,
  OrderStoreStatus,
} from '../database/models/OrderSchema';
import { emitNotification } from './notificationEvents';

// Emit delivery status updates to the user
export const emitDeliveryStatusUpdateToUser = (
  orderId: string,
  newStatus: OrderDeliveryStatus
) => {
  eventEmitter.emit('orderStatusUpdated', { orderId, newStatus });
};

// Emit store status updates to the user
export const emitStoreStatusUpdateToUser = (
  orderId: string,
  newStatus: OrderStoreStatus
) => {
  eventEmitter.emit('orderStatusUpdated', { orderId, newStatus });
};

export const emitStoreStatusUpdateToDeliveryPartner = async (
  orderId: string,
  newStatus: OrderStoreStatus
) => {
  const fcmToken = await Order.findOne({ _id: orderId })
    .populate('deliveryPartnerId', 'fcmToken')
    .then((order) => {
      if (order && order.deliveryPartnerId) {
        return order.deliveryPartnerId?.fcmToken;
      }
      return null;
    });

  console.log(fcmToken);

  if (!fcmToken) {
    console.log(`No FcmToken found for partner ${fcmToken}`);

    return;
  }

  const data = {
    role: FCMRoles.DELIVERY_PARTNER,
    orderId,
    title: 'Store Status Update',
    type: 'orderStatusUpdate',
    body: generateOrderStatusMessage(newStatus),
  };

  const message: Message = {
    token: fcmToken,
    notification: {
      title: 'Store Status Update',
      body: generateOrderStatusMessage(newStatus),
    },
    data,
  };

  emitNotification(message);
};

// Helper function to generate message based on order status
const generateOrderStatusMessage = (
  newStatus: OrderDeliveryStatus | OrderStoreStatus
) => {
  switch (newStatus) {
    // Order Delivery Status Messages
    case OrderDeliveryStatus.Delivered:
      return 'Your order has been delivered successfully.';
    case OrderDeliveryStatus.InTransit:
      return 'Your order is on its way.';
    case OrderDeliveryStatus.Collecting:
      return 'Your order is being collected from the store.';
    case OrderDeliveryStatus.Pending:
      return 'Your order is pending and will be processed soon.';
    case OrderDeliveryStatus.Assigned:
      return 'Your order has been assigned to a delivery partner.';
    case OrderDeliveryStatus.Failed:
      return 'There was an issue with your order. Please contact support.';
    case OrderDeliveryStatus.DestinationReached:
      return 'Delivery partner reached the destination.';

    // Order Store Status Messages
    case OrderStoreStatus.Cancelled:
      return 'Your order has been cancelled.';
    case OrderStoreStatus.Collected:
      return 'Your order has been collected from the store.';
    case OrderStoreStatus.Preparing:
      return 'Your order is being prepared by the store.';
    case OrderStoreStatus.ReadyForPickup:
      return 'Your order is ready for pickup from the store.';
    case OrderStoreStatus.Pending:
      return 'Your order is pending and will be processed soon.';

    default:
      return 'There is an update on your order status.';
  }
};

// Listen for status updates and notify the user
eventEmitter.on('orderStatusUpdated', async ({ orderId, newStatus }) => {
  try {
    // Fetch the order and user details
    const order = await Order.findById(orderId).populate('userId', 'fcmToken');
    if (!order) {
      console.error(`Order not found for ID: ${orderId}`);
      return;
    }

    const { fcmToken } = order.userId;

    if (!fcmToken) {
      console.log('No fcm token found! sending push notification failed');
      return;
    }

    const notificationMessage = generateOrderStatusMessage(newStatus);

    if (typeof orderId !== 'string') {
      orderId = orderId.toString();
    }

    const data = {
      role: FCMRoles.USER,
      orderId,
      title: newStatus,
      type: 'orderStatusUpdate',
      body: notificationMessage,
    };

    const message: Message = {
      token: fcmToken,
      notification: {
        title: newStatus,
        body: notificationMessage,
      },
      data,
    };

    emitNotification(message);
  } catch (error) {
    console.error(`Error sending notification for order ${orderId}:`, error);
  }
});
