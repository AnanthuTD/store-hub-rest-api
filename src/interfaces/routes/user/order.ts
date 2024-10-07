import express from 'express';
import createOrder from '../../controllers/user/order/createOrder.controller';
import { verifyPayment } from '../../controllers/user/order/verifyPayment.controller';
import orderStatusController from '../../controllers/user/order/orderStatus.controller';
import { cancelOrder } from '../../controllers/user/order/cancelOrder.controller';
import { listOrders } from '../../controllers/user/order/listOrders.controller';
import Order from '../../../infrastructure/database/models/OrderSchema';
const router = express.Router();

router.post('/', createOrder);

router.get('/', listOrders);

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

router.post('/payment/success', verifyPayment);

router.get('/status/:orderId', orderStatusController);

router.post('/cancel', cancelOrder);

export default router;
