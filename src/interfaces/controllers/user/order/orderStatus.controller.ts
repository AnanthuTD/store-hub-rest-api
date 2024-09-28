import { Request, Response } from 'express';
import Order from '../../../../infrastructure/database/models/OrderSchema';

async function orderStatusController(req: Request, res: Response) {
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId;

    const order = await Order.findOne({ userId, _id: orderId }).select([
      'paymentStatus',
      'paymentId',
      'updatedAt',
      'createdAt',
      'totalAmount',
    ]);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      message: 'Order fetched successfully',
      order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);

    return res.status(500).json({
      message: 'Server error, please try again later',
    });
  }
}

export default orderStatusController;
