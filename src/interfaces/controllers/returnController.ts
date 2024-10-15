import { Request, Response } from 'express';
import { OrderRepository } from '../../infrastructure/repositories/orderRepository';
import Order from '../../infrastructure/database/models/OrderSchema';
import mongoose from 'mongoose';

class ReturnController {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  // Request Return Controller
  requestReturnController = async (req: Request, res: Response) => {
    const { orderId, productId, variantId } = req.body;

    try {
      const isReturnRequested = await this.orderRepository.requestReturn(
        orderId,
        productId,
        variantId
      );

      if (isReturnRequested) {
        return res.status(200).json({ message: 'Return request successful.' });
      } else {
        return res.status(404).json({ message: 'Order or product not found.' });
      }
    } catch (error) {
      console.error('Error in requestReturnController:', error);
      return res.status(500).json({ message: 'Failed to request return.' });
    }
  };

  // Complete Return Controller
  completeReturnController = async (req: Request, res: Response) => {
    const { orderId, itemId, storeId } = req.body;
    const vendorId = req.user._id;

    try {
      const isReturnCompleted = await this.orderRepository.completeReturn(
        orderId,
        itemId,
        storeId,
        vendorId
      );

      if (isReturnCompleted) {
        return res
          .status(200)
          .json({ message: 'Return completed and refunded.' });
      } else {
        return res
          .status(404)
          .json({ message: 'Order or product not found or refund failed.' });
      }
    } catch (error) {
      console.error('Error in completeReturnController:', error);
      return res.status(500).json({ message: 'Failed to complete return.' });
    }
  };

  async getReturnRequestedItems(req: Request, res: Response) {
    const { storeId } = req.query;
    console.log(storeId);

    try {
      const returnRequestedItems = await Order.aggregate([
        {
          $match: {
            'items.returnStatus': 'Requested',
            'items.storeId': new mongoose.Types.ObjectId(storeId),
          },
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.returnStatus': 'Requested',
            'items.storeId': new mongoose.Types.ObjectId(storeId),
          },
        },
        { $project: { items: 1 } },
      ]).sort({ updatedAt: -1 });

      return res.status(200).json(returnRequestedItems);
    } catch (error) {
      console.error('Error fetching return requested items:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getReturnedItems(req: Request, res: Response) {
    const { storeId } = req.query;
    console.log(storeId);

    try {
      const returnedItems = await Order.aggregate([
        {
          $match: {
            'items.returnStatus': 'Completed',
            'items.storeId': new mongoose.Types.ObjectId(storeId),
          },
        },
        { $unwind: '$items' },
        {
          $match: {
            'items.returnStatus': 'Completed',
            'items.storeId': new mongoose.Types.ObjectId(storeId),
          },
        },
        { $project: { items: 1 } },
      ]);

      return res.status(200).json(returnedItems);
    } catch (error) {
      console.error('Error fetching returned items:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const returnController = new ReturnController();
