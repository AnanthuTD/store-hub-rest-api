import express from 'express';
import {
  getOrderDeliveryDetails,
  getOrders,
} from '../../controllers/admin/order.controller';

const router = express.Router();

// Route to get the list of orders
router.get('/', getOrders);

// Route to get detailed delivery information for a specific order
router.get('/:id/delivery-details', getOrderDeliveryDetails);

export default router;
