import express, { Request, Response } from 'express';
import Order from '../../../infrastructure/database/models/OrderSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import Shop from '../../../infrastructure/database/models/ShopSchema';
import Coupon from '../../../infrastructure/database/models/CouponSchema';
import { User } from '../../../infrastructure/database/models/UserSchema';

const dashboardRouter = express.Router();

dashboardRouter.get('/revenue', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({});

    // Initialize totals
    let totalMoneyGenerated = 0;
    let totalProfit = 0;
    let totalPaidToVendors = 0;
    let totalPaidToDeliveryPartners = 0;

    // Calculate totals from orders
    orders.forEach((order) => {
      totalMoneyGenerated += order.totalAmount;
      totalPaidToVendors += order.storeAmount;
      totalPaidToDeliveryPartners += order.deliveryFee;

      // Profit = Payable Amount - (Store Amount + Delivery Fee)
      const orderProfit =
        order.totalAmount -
        (order.storeAmount +
          (order.deliveryFee ?? 0) +
          (order.platformFee ?? 0));

      totalProfit += orderProfit;
    });

    // Send response with calculated stats
    res.json({
      totalMoneyGenerated,
      totalProfit,
      totalPaidToVendors,
      totalPaidToDeliveryPartners,
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ message: 'Error fetching order statistics' });
  }
});

// Route to get total users and new users count
dashboardRouter.get('/users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({
      createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },
    }); // Users created in the last 30 days

    res.json({ totalUsers, newUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get order statistics
dashboardRouter.get('/orders', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      deliveryStatus: 'Pending',
    });
    const cancelledOrders = await Order.countDocuments({
      deliveryStatus: 'Cancelled',
    });

    // Assuming 'Delivered' is a status for successful deliveries
    const deliveredOrders = await Order.countDocuments({
      deliveryStatus: 'Delivered',
    });
    const orderFulfillmentRate = totalOrders
      ? (deliveredOrders / totalOrders) * 100
      : 0;

    res.json({
      totalOrders,
      pendingOrders,
      cancelledOrders,
      orderFulfillmentRate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get top shops
dashboardRouter.get('/top-stores', async (req, res) => {
  try {
    const topStores = await Shop.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'storeId',
          as: 'orders',
        },
      },
      {
        $project: {
          name: 1,
          totalSales: { $sum: '$orders.storeAmount' },
        },
      },
      {
        $sort: { totalSales: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({ topStores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get top products
dashboardRouter.get('/top-products', async (req, res) => {
  try {
    const topProducts = await StoreProducts.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.productId',
          as: 'orders',
        },
      },
      { $unwind: '$orders' },
      { $group: { _id: '$_id', productName: { $first: '$name' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }, // Top 5 products
    ]);

    console.log(topProducts);

    res.json({ topProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to get coupons used
dashboardRouter.get('/coupons-used', async (req, res) => {
  try {
    const couponsUsed = await Coupon.countDocuments({ used: true });

    res.json({ couponsUsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default dashboardRouter;
