import express from 'express';
import {
  collected,
  delivered,
  storeReached,
  userReached,
} from '../../controllers/deliveryPartner/deliveryController';
import { emitDeliveryStatusUpdateToUser } from '../../../infrastructure/events/orderEvents';
import { OrderDeliveryStatus } from '../../../infrastructure/database/models/OrderSchema';

const router = express.Router();

router.post('/store-reached', storeReached);
router.post('/collected', collected);
router.post('/user-reached', userReached);
router.post('/delivered', delivered);

router.get('/test', () => {
  emitDeliveryStatusUpdateToUser(
    '670b6af54cb466fed0c3d9b0',
    OrderDeliveryStatus.Assigned
  );
});

export default router;
