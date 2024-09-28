import express from 'express';
import createOrder from '../../controllers/user/order/createOrder.controller';
import { verifyPayment } from '../../controllers/user/order/verifyPayment.controller';
import orderStatusController from '../../controllers/user/order/orderStatus.controller';
const router = express.Router();

router.post('/', createOrder);

router.post('/payment/success', verifyPayment);

router.get('/status/:orderId', orderStatusController);

export default router;
