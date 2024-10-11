import mongoose, { ObjectId } from 'mongoose';
import DeliveryPartner from '../database/models/DeliveryPartner';
import Order, {
  OrderDeliveryStatus,
  IOrder,
  OrderReturnStatus,
  OrderStoreStatus,
} from '../database/models/OrderSchema';
import UserRepository from './UserRepository';

interface AssignPartnerProps {
  partnerId: string;
  orderId: string;
  partnerName?: string;
}

export class OrderRepository {
  async assignPartner({ partnerId, orderId, partnerName }: AssignPartnerProps) {
    if (!partnerName) {
      const partner = await DeliveryPartner.findById(partnerId)
        .select(['firstName', 'lastName'])
        .lean();

      if (!partner) {
        throw new Error('Partner not found');
      }
      partnerName = partner.firstName + ' ' + partner.lastName;
    }

    await Order.findByIdAndUpdate(orderId, {
      deliveryPartnerId: partnerId,
      partnerName,
      deliveryStatus: OrderDeliveryStatus.Assigned,
    });

    return true;
  }

  async findOrderById(orderId: string | ObjectId): Promise<IOrder | null> {
    return Order.findById(orderId);
  }

  async updateDeliveryStatus(
    orderId: string | ObjectId,
    status: OrderDeliveryStatus
  ) {
    await Order.findByIdAndUpdate(
      orderId,
      { deliveryStatus: status },
      { new: true }
    );
    return true;
  }

  async requestReturn(
    orderId: string | ObjectId,
    productId: string | ObjectId,
    variantId: string | ObjectId
  ): Promise<boolean> {
    try {
      const result = await Order.updateOne(
        {
          _id: orderId,
          'items.productId': productId,
          'items.variantId': variantId,
          'items.returnStatus': OrderReturnStatus.NotRequested,
          'items.isCancelled': false,
        },
        {
          $set: { 'items.$.returnStatus': OrderReturnStatus.Requested },
        }
      );

      console.log(result);

      if (result.modifiedCount > 0) {
        console.log('Return request updated successfully');
        return true;
      } else {
        console.log('No matching order or product found');
        return false;
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      return false;
    }
  }

  async completeReturn(
    orderId: string | ObjectId,
    itemId: string | ObjectId,
    storeId: string
  ) {
    try {
      console.log(itemId, orderId);
      // Update return status to Completed
      const result = await Order.findOneAndUpdate(
        {
          _id: orderId,
          'items._id': itemId,
          'items.returnStatus': OrderReturnStatus.Requested,
          'items.isCancelled': false,
          'items.storeId': new mongoose.Types.ObjectId(storeId),
        },
        {
          $set: { 'items.$.returnStatus': OrderReturnStatus.Completed },
        },
        { new: true } // Return the updated document
      );

      if (!result) {
        console.log('No matching order or product found');
        return false;
      }

      console.log('Return completed successfully');

      // Refund the user
      const itemToRefund = result.items.find(
        (item) => item._id.toString() === itemId
      );

      if (!itemToRefund) {
        console.log('Product not found in the order');
        return false;
      }

      // Calculate refund amount
      const { amountToCredit, refundMessage } = this.calculateRefundAmount(
        result,
        itemToRefund
      );

      // Update the item with refund message
      result.items.forEach((item) => {
        if (item._id.toString() === itemId) {
          item.refundMessage = refundMessage;
        }
      });

      await result.save();

      // Call the refund processing function
      return await this.processRefund(result.userId, amountToCredit);
    } catch (error) {
      console.error('Error completing return:', error);
      return false;
    }
  }

  async getStoreStatusValues() {
    const values = Object.values(OrderStoreStatus);
    return values;
  }

  async updateStoreStatus(
    orderId: string | ObjectId,
    newStatus: OrderStoreStatus
  ): Promise<boolean> {
    try {
      const result = await Order.updateOne(
        { _id: orderId },
        { $set: { storeStatus: newStatus } }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `Order status updated to ${newStatus} for order ID: ${orderId}`
        );
        return true;
      } else {
        console.log(
          `No matching order found or status is already ${newStatus}`
        );
        return false;
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  async getCurrentStoreStatus(
    orderId: string | ObjectId
  ): Promise<OrderStoreStatus | null> {
    try {
      const order = await Order.findById(orderId).select('storeStatus');
      return order ? order.storeStatus : null;
    } catch (error) {
      console.error('Error retrieving order status:', error);
      return null;
    }
  }

  async cancelItem(orderId: string | ObjectId, itemId: string | ObjectId) {
    const order = await Order.findById(orderId);
    if (order?.storeStatus || order?.storeStatus === OrderStoreStatus.Pending) {
      order.items.forEach((item) => {
        if (item?._id.toString() === itemId) {
          item.isCancelled = true;
        }
      });
      return true;
    }
    return false;
  }

  calculateRefundAmount(order: any, itemToRefund: any) {
    let amountToCredit = itemToRefund.price || 0;
    let refundMessage = '';

    if (!amountToCredit) {
      refundMessage = 'Refund not processed due to missing price information';
      return { amountToCredit: 0, refundMessage };
    }

    // Check if refund invalidates coupon
    const newTotalAmount = order.totalAmount - amountToCredit;
    if (
      order.couponApplied &&
      newTotalAmount < order.couponApplied.minOrderValue
    ) {
      refundMessage = `Refund not processed as the remaining total falls below the coupon's minimum order value.`;
      amountToCredit = 0;
    } else {
      refundMessage = `Refund of ₹${amountToCredit} processed successfully.`;
    }

    return { amountToCredit, refundMessage };
  }

  async processRefund(userId: string | ObjectId, amountToCredit: number) {
    if (amountToCredit > 0) {
      const userRepository = new UserRepository();
      await userRepository.creditMoneyToWallet(amountToCredit, userId);
      console.log(`Credited ₹${amountToCredit} to user wallet`);
      return true;
    } else {
      console.log('Refund canceled due to coupon invalidation');
      return false;
    }
  }
}
