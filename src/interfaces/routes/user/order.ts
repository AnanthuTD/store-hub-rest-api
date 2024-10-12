import express from 'express';
import createOrder from '../../controllers/user/order/createOrder.controller';
import { verifyPayment } from '../../controllers/user/order/verifyPayment.controller';
import orderStatusController from '../../controllers/user/order/orderStatus.controller';
import { cancelOrder } from '../../controllers/user/order/cancelOrder.controller';
import { listOrders } from '../../controllers/user/order/listOrders.controller';
import Order from '../../../infrastructure/database/models/OrderSchema';
import { cancelItem } from '../../controllers/user/order/cancelItem.controller';
import { getDeliveryCharge } from '../../controllers/user/getDeliveryCharge';
const router = express.Router();

router.post('/', createOrder);

router.get('/', listOrders);

router.get('/platform-fee', (req, res) =>
  res.status(200).json({ platformFee: 16 })
);

router.post('/payment/success', verifyPayment);

router.post('/cancel', cancelOrder);

router.post('/cancel-item', cancelItem);

router.get('/calculate-delivery-charge', getDeliveryCharge);

router.get('/status/:orderId', orderStatusController);

router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order, message: 'Order found successfully' });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
