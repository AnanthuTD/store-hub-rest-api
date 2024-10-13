import { Request, Response } from 'express';
import { OrderRepository } from '../../infrastructure/repositories/orderRepository';
import {
  emitStoreStatusUpdateToDeliveryPartner,
  emitStoreStatusUpdateToUser,
} from '../../infrastructure/events/orderEvents';

export class OrderController {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async getStoreStatusValues(req: Request, res: Response) {
    const values = await this.orderRepo.getStoreStatusValues();
    return res.status(200).json(values);
  }

  async updateStoreStatus(req: Request, res: Response) {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ message: 'Order ID and status are required' });
    }

    try {
      const result = await this.orderRepo.updateStoreStatus(orderId);

      if (result) {
        res.status(200).json({
          message: `Order status updated to ${result}`,
          storeStatus: result,
        });

        // push notification to user
        emitStoreStatusUpdateToUser(orderId, result);
        emitStoreStatusUpdateToDeliveryPartner(orderId, result);
      } else {
        return res.status(404).json({
          message: 'Order not found or status is already set to that value',
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getStoreStatus(req: Request, res: Response) {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    try {
      const status = await this.orderRepo.getCurrentStoreStatus(orderId);

      if (status !== null) {
        return res.status(200).json({ orderId, status });
      } else {
        return res.status(404).json({ message: 'Order not found' });
      }
    } catch (error) {
      console.error('Error retrieving order status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
