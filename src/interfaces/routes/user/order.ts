import express from 'express';
import createOrder from '../../controllers/user/order/createOrder.controller';
const router = express.Router();

router.post('/', createOrder);

export default router;
