import express from 'express';
import fetchOrders from '../../controllers/vendor/order/fetchOrders';
import { OrderController } from '../../controllers/orderController';
const router = express.Router();

const orderController = new OrderController();

router.get('/', fetchOrders.bind(orderController));
router.patch(
  '/store-status',
  orderController.updateStoreStatus.bind(orderController)
);

export default router;
