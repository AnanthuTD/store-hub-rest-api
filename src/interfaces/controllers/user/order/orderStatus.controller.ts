import { Request, Response } from 'express';
import Order from '../../../../infrastructure/database/models/OrderSchema';
import redisClient from '../../../../infrastructure/redis/redisClient';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';

async function orderStatusController(req: Request, res: Response) {
  try {
    const userId = getRequestUserId(req);
    const orderId = req.params.orderId;

    const order = await Order.findOne({ userId, _id: orderId }).select([
      'paymentStatus',
      'paymentId',
      'updatedAt',
      'createdAt',
      'totalAmount',
      'payableAmount',
      'deliveryStatus',
      'deliveryPartnerName',
      'deliveryPartnerId',
      'deliveryOTP',
    ]);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const location = await redisClient.geopos(
      'delivery-partner:location',
      order?.deliveryPartnerId?.toString()
    );

    return res.status(200).json({
      message: 'Order fetched successfully',
      order,
      location:
        location && location[0]
          ? {
              lng: Number.parseFloat(location[0][0]),
              lat: Number.parseFloat(location[0][1]),
            }
          : null,
    });
  } catch (error) {
    console.error('Error fetching order:', error);

    return res.status(500).json({
      message: 'Server error, please try again later',
    });
  }
}

export default orderStatusController;
