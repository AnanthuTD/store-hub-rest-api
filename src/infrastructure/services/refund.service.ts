import { ObjectId } from 'mongoose';
import { OrderPaymentStatus } from '../database/models/OrderSchema';
import { OrderRepository } from '../repositories/orderRepository';
import TransactionRepository from '../repositories/TransactionRepository';
import UserRepository from '../repositories/UserRepository';

export class RefundService {
  userRepository = new UserRepository();
  transactionRepository = new TransactionRepository();

  async refundOrder(orderId: string | ObjectId) {
    const order = await new OrderRepository().findOrderById(orderId);
    if (!order) {
      return false;
    }
    if (order.paymentStatus === OrderPaymentStatus.Completed) {
      const user = await this.userRepository.getUserById(order.userId);
      if (!user) {
        return false;
      }

      const refundAmount = order.totalAmount;
      if (!refundAmount) return true;

      order.paymentStatus = OrderPaymentStatus.Refunded;
      await order.save();

      await this.userRepository.creditMoneyToWallet(refundAmount, order.userId);

      return true;
    }
  }
}
