import { Request, Response } from 'express';
import Order from '../../../../infrastructure/database/models/OrderSchema';

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    // Update the order status to "Cancelled"
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You cannot cancel this order' });
    }

    // Optional: Check if the payment is already completed, don't cancel in that case
    if (order.paymentStatus !== 'Pending') {
      return res
        .status(400)
        .json({ message: 'Cannot cancel a completed order' });
    }

    await order.deleteOne();

    return res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
