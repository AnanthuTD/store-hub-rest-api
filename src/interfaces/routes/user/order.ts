import express from 'express';
import createOrder from '../../controllers/user/order/createOrder.controller';
import { verifyPayment } from '../../controllers/user/order/verifyPayment.controller';
const router = express.Router();

router.post('/', createOrder);

router.post('/payment/success', verifyPayment);

export default router;
