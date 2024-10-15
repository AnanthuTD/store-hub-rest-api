import express from 'express';
import Order from '../../../infrastructure/database/models/OrderSchema';
import dayjs from 'dayjs';
const router = express.Router();

router.get('/', async (req, res) => {
  const partnerId = req.user._id;

  const requestedDate = req.query.date ? dayjs(req.query.date) : dayjs();

  const startOfDay = requestedDate.startOf('day').toDate();
  const endOfDay = requestedDate.endOf('day').toDate();

  console.log(
    `Fetching orders for partner: ${partnerId} from ${startOfDay} to ${endOfDay}`
  );

  try {
    const orders = await Order.find({
      deliveryPartnerId: partnerId,
      orderDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('storeId', 'name address')
      .lean();

    const enrichedOrders = orders.map((order) => {
      order.store = order?.storeId;
      delete order.storeId;
      return order;
    });

    res.json({ orders: enrichedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:orderId/order', async (req, res) => {
  const partnerId = req.user._id;
  const { orderId } = req.params;

  try {
    const order = await Order.findOne({
      _id: orderId,
      deliveryPartnerId: partnerId,
    })
      .populate('userId', [
        'profile.firstName',
        'profile.lastName',
        'mobileNumber',
      ])
      .lean();

    if (order) {
      order.user = order?.userId;
      delete order.userId;
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
