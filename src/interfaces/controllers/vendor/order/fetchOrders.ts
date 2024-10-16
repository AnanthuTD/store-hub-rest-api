import { Request, Response } from 'express';
import Order, {
  OrderPaymentStatus,
  OrderStoreStatus,
} from '../../../../infrastructure/database/models/OrderSchema';
import mongoose from 'mongoose';
import Shop from '../../../../infrastructure/database/models/ShopSchema';

export default async function fetchOrdersV2(req: Request, res: Response) {
  try {
    // Extract query parameters
    const {
      sortBy = 'orderDate',
      order = 'asc',
      paymentMethod,
      searchId,
      startDate,
      endDate,
      storeId,
      storeStatus,
    } = req.query;

    const userId = req.user._id;

    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    const store = await Shop.findById(storeId).lean();

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store?.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: `This vendor is not authorized to access order details of store #${storeId}`,
      });
    }

    const storeStatusArray =
      storeStatus === 'Collected'
        ? [OrderStoreStatus.Collected]
        : [
            OrderStoreStatus.Pending,
            OrderStoreStatus.Preparing,
            OrderStoreStatus.ReadyForPickup,
          ];

    // Build aggregation pipeline
    const pipeline: any[] = [
      {
        $match: {
          paymentStatus: OrderPaymentStatus.Completed,
          storeStatus: { $in: storeStatusArray },

          ...(paymentMethod ? { paymentMethod } : {}),

          ...(searchId && mongoose.isValidObjectId(searchId as string)
            ? { _id: new mongoose.Types.ObjectId(searchId as string) }
            : {}),

          ...(startDate && endDate
            ? {
                orderDate: {
                  $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                  $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                },
              }
            : {}),

          'items.storeId': store._id,
        },
      },
      {
        $unwind: '$items',
      },
      {
        $match: {
          ...(storeId
            ? {
                'items.storeId': store._id,
              }
            : {}),
        },
      },
      {
        $group: {
          _id: '$_id', // Group back by order id
          userId: { $first: '$userId' },
          items: { $push: '$items' }, // Reconstruct items array
          totalAmount: {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
          orderDate: { $first: '$orderDate' },
          paymentStatus: { $first: '$paymentStatus' },
          paymentId: { $first: '$paymentId' },
          paymentMethod: { $first: '$paymentMethod' },
          shippingAddress: { $first: '$shippingAddress' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          storeStatus: { $first: '$storeStatus' },
          storeAmount: { $first: '$totalAmount' },
        },
      },
      // Lookup to join user details
      {
        $lookup: {
          from: 'users', // The collection name in the DB
          localField: 'userId', // Field in Order
          foreignField: '_id', // Field in User
          as: 'userDetails', // Output field name for user data
        },
      },
      {
        $unwind: '$userDetails', // Ensure a single user object
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          items: 1,
          totalAmount: 1,
          orderDate: 1,
          paymentStatus: 1,
          paymentId: 1,
          paymentMethod: 1,
          shippingAddress: 1,
          createdAt: 1,
          updatedAt: 1,
          userDetails: {
            'profile.firstName': 1,
            'profile.lastName': 1,
            email: 1,
            mobileNumber: 1,
          },
          storeStatus: 1,
          storeAmount: 1,
        },
      },
      {
        $sort: { [sortBy as string]: order === 'desc' ? -1 : 1 },
      },
    ];

    // Execute aggregation
    const orders = await Order.aggregate(pipeline).exec();

    // Response
    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
