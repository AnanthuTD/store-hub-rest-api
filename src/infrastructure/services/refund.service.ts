import mongoose, { ObjectId } from 'mongoose';
import { OrderPaymentStatus } from '../database/models/OrderSchema';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../database/models/TransactionSchema';
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

      const refundAmount = order.totalAmount * 0.8;
      const transaction = await this.transactionRepository.createTransaction({
        userId: order.userId as mongoose.Schema.Types.ObjectId,
        amount: refundAmount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.SUCCESS,
      } as ITransaction);

      if (transaction) {
        order.paymentStatus = OrderPaymentStatus.Refunded;
        await order.save();

        await this.userRepository.creditMoneyToWallet(
          refundAmount,
          order.userId
        );

        return true;
      }
      return false;
    }
  }
}
