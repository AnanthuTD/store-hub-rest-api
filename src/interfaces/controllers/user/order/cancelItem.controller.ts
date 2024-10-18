import { Request, Response } from 'express';
import { OrderRepository } from '../../../../infrastructure/repositories/orderRepository';
import Order from '../../../../infrastructure/database/models/OrderSchema';

export async function cancelItem(req: Request, res: Response) {
  try {
    const { orderId, itemId } = req.body;
    const userId = req.user._id;
    const orderRepository = new OrderRepository();

    // Fetch the order
    const order = await Order.findById(orderId).populate('storeId', 'ownerId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order belongs to the current user
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You cannot cancel this order' });
    }

    // Fetch the item to be canceled
    const itemToCancel = order.items.find(
      (item) => item._id.toString() === itemId.toString()
    );
    if (!itemToCancel) {
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log(itemToCancel);

    if (itemToCancel.isCancelled) {
      return res.status(404).json({ message: 'Already cancelled' });
    }

    // Update the item status to "Cancelled"
    const result = await orderRepository.cancelItem(orderId, itemId);
    if (!result) {
      return res.status(404).json({ message: 'Cannot cancel this item' });
    }

    // Calculate refund for the canceled item
    const { amountToCredit, refundMessage } =
      orderRepository.calculateRefundAmount(order, itemToCancel);

    // Update the item with refund message
    itemToCancel.refundMessage = refundMessage;
    await order.save();

    const vendorId = order.storeId.ownerId;

    // Process refund
    const refundSuccess = await orderRepository.processRefund(
      order.userId,
      amountToCredit,
      vendorId
    );
    if (!refundSuccess) {
      return res.status(400).json({
        message: 'Refund processing failed or coupon invalidation occurred',
      });
    }

    return res
      .status(200)
      .json({ message: 'Item cancelled and refund processed successfully' });
  } catch (error) {
    console.error('Error cancelling item:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
