import express from 'express';
import Order, {
  OrderDeliveryStatus,
} from '../../../infrastructure/database/models/OrderSchema';
import { io } from '../../../socket';
import { GoogleRoutesService } from '../../../infrastructure/services/googleRoutes.service';
import { getDeliveryPartnerCurrentLocation } from '../../../infrastructure/services/sendOrderDetails';

const router = express.Router();

router.post('/store-reached', async (req, res) => {
  const { orderId } = req.body;
  const partnerId = req.user._id;

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
    io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    });

    return res.status(200).json({
      message: 'Order status updated to Collecting successfully',
      deliveryStatus: order.deliveryStatus,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/collected', async (req, res) => {
  const { orderId } = req.body;
  const partnerId = req.user._id;

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
        // deliveryStatus: OrderDeliveryStatus.Collecting,
      },
      { deliveryStatus: OrderDeliveryStatus.InTransit }, // Update status to In Transit
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message:
          'Order not found or not in Collecting state! First collect the order.',
      });
    }

    // Emit event to notify clients about the status update
    io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    });

    const partnerLocation = await getDeliveryPartnerCurrentLocation(partnerId);

    console.log(partnerLocation, order.deliveryLocation.coordinates);

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
});

router.post('/user-reached', async (req, res) => {
  const { orderId } = req.body;
  const partnerId = req.user._id;

  try {
    // Find and update the order
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartnerId: partnerId,
        // deliveryStatus: OrderDeliveryStatus.Collecting,
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

    // Emit event to notify clients about the status update
    io.of('/track').to(orderId).emit('order:status:update', {
      deliveryStatus: order.deliveryStatus,
    });

    return res.status(200).json({
      message: 'Order status updated to In Transit successfully',
      deliveryStatus: order.deliveryStatus,
      direction: null,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
