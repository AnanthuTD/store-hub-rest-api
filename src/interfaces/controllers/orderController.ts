import { Request, Response } from 'express';
import { OrderRepository } from '../../infrastructure/repositories/orderRepository';
import {
  emitStoreStatusUpdateToDeliveryPartner,
  emitStoreStatusUpdateToUser,
} from '../../infrastructure/events/orderEvents';
import { OrderStoreStatus } from '../../infrastructure/database/models/OrderSchema';
import { VendorOwnerRepository } from '../../infrastructure/repositories/VendorRepository';
import Shop from '../../infrastructure/database/models/ShopSchema';

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
    const { orderId, otp } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID and OTP are required' });
    }

    try {
      const result = await this.orderRepo.updateStoreStatus(orderId, otp);

      if (result.success && result.status) {
        // If the status update is successful
        res.status(200).json({
          message: result.message,
          storeStatus: result.status,
        });

        // Push notifications to user and delivery partner
        emitStoreStatusUpdateToUser(orderId, result.status);
        emitStoreStatusUpdateToDeliveryPartner(orderId, result.status);

        if (result.status === OrderStoreStatus.Collected && result.storeId) {
          const store = await Shop.findById(result.storeId, { ownerId: 1 });
          new VendorOwnerRepository().creditMoneyToWallet(
            result.storeAmount,
            store?.ownerId
          );
        }
      } else {
        // If there's an issue, return the failure message
        return res.status(400).json({
          message: result.message,
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
