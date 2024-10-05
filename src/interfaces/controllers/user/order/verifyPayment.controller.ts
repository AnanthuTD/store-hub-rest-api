import { Request, Response } from 'express';
import crypto from 'crypto';
import env from '../../../../infrastructure/env/env';
import Order, {
  IOrder,
} from '../../../../infrastructure/database/models/OrderSchema';
import Cart from '../../../../infrastructure/database/models/CartSchema';
import { assignDeliveryPartnerForOrder } from '../../../../infrastructure/services/partnerAssignmentService';
import { StoreProductRepository } from '../../../../infrastructure/repositories/storeProductRepository';

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Destructuring the payment details from the request body
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Step 1: Creating a digest using HMAC SHA-256
    const shasum = crypto.createHmac('sha256', env.RAZORPAY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    // Step 2: Comparing our digest with Razorpay's signature
    if (digest !== razorpaySignature) {
      return res.status(400).json({ message: 'Transaction not legit!' });
    }

    // Step 3: If payment is verified, update the order's payment status
    const order: IOrder | null = await Order.findOne({
      paymentId: razorpayOrderId,
    });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Step 4: Update the payment status and save the order in the database
    order.paymentStatus = 'Completed';
    order.paymentId = razorpayPaymentId;
    await order.save();

    assignDeliveryPartnerForOrder({
      orderId: order._id as string,
      longitude: order.deliveryLocation.longitude,
      latitude: order.deliveryLocation.latitude,
    });

    // Step 5: Send success response to the client
    res.status(200).json({
      message: 'Payment verified and order updated successfully!',
      orderId: order._id,
      paymentId: razorpayPaymentId,
    });

    order.items.forEach((item) => {
      new StoreProductRepository().decrementStocks(
        item.productId,
        item.variantId,
        item.quantity
      );
    });

    clearCart(userId);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function clearCart(userId: string) {
  Cart.deleteOne({ userId }).then((data) => {
    console.log(data);
  });
}
