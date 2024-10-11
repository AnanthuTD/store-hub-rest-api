import { ObjectId } from 'mongoose';
import DeliveryPartner from '../database/models/DeliveryPartner';
import Order, {
  OrderDeliveryStatus,
  IOrder,
  OrderReturnStatus,
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
        },
        {
          $set: { 'items.$.returnStatus': OrderReturnStatus.Requested },
        }
      );

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
    productId: string | ObjectId,
    variantId: string | ObjectId
  ) {
    try {
      // Update return status to Completed
      const result = await Order.findOneAndUpdate(
        {
          _id: orderId,
          'items.productId': productId,
          'items.variantId': variantId,
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
        (item) =>
          item.productId.toString() === productId.toString() &&
          item.variantId.toString() === variantId.toString()
      );

      let amountToCredit = itemToRefund?.price || 0;
      let refundMessage = '';

      if (!amountToCredit) {
        refundMessage = 'Refund not processed due to missing price information';
        console.log('Price not found for the product');
        return false;
      }

      // Check if refund invalidates coupon
      const newTotalAmount = result.totalAmount - amountToCredit;
      if (
        result.couponApplied &&
        newTotalAmount < result.couponApplied.minOrderValue
      ) {
        console.log(
          `Coupon no longer valid after return, refund adjusted to 0`
        );
        refundMessage = `Refund not processed as the remaining total falls below the coupon's minimum order value.`;
        amountToCredit = 0;
      } else {
        refundMessage = `Refund of ₹${amountToCredit} processed successfully.`;
      }

      // Update the item with refund message
      result.items.forEach((item) => {
        if (
          item.variantId.toString() === variantId.toString() &&
          item.productId.toString() === productId.toString()
        ) {
          item.refundMessage = refundMessage;
        }
      });

      await result.save();

      if (amountToCredit > 0) {
        const userRepository = new UserRepository();
        await userRepository.creditMoneyToWallet(amountToCredit, result.userId);
        console.log(`Credited ₹${amountToCredit} to user wallet`);
      } else {
        console.log('Refund canceled due to coupon invalidation');
      }

      return true;
    } catch (error) {
      console.error('Error completing return:', error);
      return false;
    }
  }
}
