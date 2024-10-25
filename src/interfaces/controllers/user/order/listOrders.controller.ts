import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../../../../infrastructure/database/models/OrderSchema';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';

export const listOrders = async (req: Request, res: Response) => {
  try {
    const userId = getRequestUserId(req) as mongoose.Schema.Types.ObjectId;
    const {
      search,
      paymentStatus,
      storeId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { userId };

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (storeId) {
      query['items.storeId'] = storeId;
    }

    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (search) {
      query.$or = [
        { 'items.productId.name': { $regex: search, $options: 'i' } },
        { 'items.storeId.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()
      .exec();

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        totalOrders,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalOrders / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};
