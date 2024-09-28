import express from 'express';
import fetchOrders from '../../controllers/vendor/order/fetchOrders';
const router = express.Router();

router.get('/', fetchOrders);

export default router;
