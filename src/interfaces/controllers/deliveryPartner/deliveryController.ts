import { Request, Response } from 'express';
import Order, {
  OrderDeliveryStatus,
} from '../../../infrastructure/database/models/OrderSchema';
import { GoogleRoutesService } from '../../../infrastructure/services/googleRoutes.service';
import { getDeliveryPartnerCurrentLocation } from '../../../infrastructure/services/sendOrderDetails';
import { emitDeliveryStatusUpdateToUser } from '../../../infrastructure/events/orderEvents';
import { DeliveryPartnerRepository } from '../../../infrastructure/repositories/DeliveryPartnerRepository';
import redisClient from '../../../infrastructure/redis/redisClient';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

export const storeReached = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const partnerId = getRequestUserId(req);

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
        deliveryStatus: { $ne: OrderDeliveryStatus.Delivered },
      },
      { deliveryStatus: OrderDeliveryStatus.Collecting },
      { new: true }
    );

    if (!order) {
      return res
        .status(404)
        .json({ message: 'Order not found or already delivered' });
    }

    // Emit event to notify clients about the status update
    /*  io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    }); */

    // send push notification to user
    emitDeliveryStatusUpdateToUser(orderId, OrderDeliveryStatus.Collecting);

    return res.status(200).json({
      message: 'Order status updated to Collecting successfully',
      deliveryStatus: order.deliveryStatus,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const collected = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const partnerId = getRequestUserId(req);

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
      },
      { deliveryStatus: OrderDeliveryStatus.InTransit },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message:
          'Order not found or not in Collecting state! First collect the order.',
      });
    }

    // Emit event to notify clients about the status update
    /* io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    }); */

    // send push notification to user
    emitDeliveryStatusUpdateToUser(orderId, order.deliveryStatus);

    const partnerLocation = await getDeliveryPartnerCurrentLocation(partnerId);

    const direction = await new GoogleRoutesService().fetchDirections({
      originLocation: {
        latitude: partnerLocation?.latitude,
        longitude: partnerLocation?.longitude,
      },
      destinationLocation: {
        longitude: order.deliveryLocation.coordinates[0],
        latitude: order.deliveryLocation.coordinates[1],
      },
    });

    return res.status(200).json({
      message: 'Order status updated to In Transit successfully',
      deliveryStatus: order.deliveryStatus,
      direction,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const userReached = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const partnerId = getRequestUserId(req);

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
      },
      { deliveryStatus: OrderDeliveryStatus.DestinationReached },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message:
          'Order not found or not in Collecting state! First collect the order.',
      });
    }

    // Emit event to notify clients about the status update
    /*  io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    }); */

    // send push notification to user
    emitDeliveryStatusUpdateToUser(orderId, order.deliveryStatus);

    return res.status(200).json({
      message: 'Order status updated to destination reached successfully',
      deliveryStatus: order.deliveryStatus,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const delivered = async (req: Request, res: Response) => {
  const { orderId, otp } = req.body;
  const partnerId = getRequestUserId(req);

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
      },
      { deliveryStatus: OrderDeliveryStatus.Delivered },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message:
          'Order not found or not in Collecting state! First collect the order.',
      });
    }

    if (order.deliveryOTP !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP!' });
    }

    // make partner available
    redisClient.srem('unavailable-partners', partnerId);

    // send push notification to user
    emitDeliveryStatusUpdateToUser(orderId, order.deliveryStatus);

    // crediting the delivery fee to the partner wallet
    new DeliveryPartnerRepository().creditMoneyToWallet(
      order.deliveryFee!,
      partnerId
    );

    return res.status(200).json({
      message: 'Order status updated to Delivered successfully',
      deliveryStatus: order.deliveryStatus,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
