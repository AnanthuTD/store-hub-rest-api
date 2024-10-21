import express from 'express';
import mongoose from 'mongoose';
import Order from '../../../infrastructure/database/models/OrderSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';

const dashboardRouter = express.Router();

// Helper function to check if storeId is valid
const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * Route 1: Get Orders for a Store
 * GET /api/store/:storeId/orders
 * Fetch all orders for a particular store
 */
dashboardRouter.get('/store/:storeId/orders', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const orders = await Order.find({ storeId: storeId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 2: Get Total Revenue for a Store
 * GET /api/store/:storeId/revenue
 * Fetch total revenue for a store by summing up storeAmount for all orders
 */
dashboardRouter.get('/store/:storeId/revenue', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const result = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: '$items.storeId',
          totalRevenue: { $sum: '$storeAmount' },
        },
      },
    ]);

    const totalRevenue = result[0]?.totalRevenue || 0;
    res.json({ totalRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 3: Get Return Requests for a Store
 * GET /api/store/:storeId/returns
 * Fetch total return requests and completed returns for a store
 */
dashboardRouter.get('/store/:storeId/returns', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const totalReturnRequests = await Order.countDocuments({
      'items.storeId': storeId,
      'items.returnStatus': 'Requested',
    });

    const completedReturns = await Order.countDocuments({
      'items.storeId': storeId,
      'items.returnStatus': 'Completed',
    });

    res.json({ totalReturnRequests, completedReturns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 4: Get Cancelled Orders for a Store
 * GET /api/store/:storeId/cancellations
 * Fetch total cancelled orders for a store
 */
dashboardRouter.get('/store/:storeId/cancellations', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const cancelledOrders = await Order.countDocuments({
      'items.storeId': storeId,
      'items.isCancelled': true,
    });

    res.json({ cancelledOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 5: Get Average Order Value for a Store
 * GET /api/store/:storeId/average-order-value
 * Fetch the average value of orders for a store
 */
dashboardRouter.get('/store/:storeId/average-order-value', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const result = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: '$items.storeId',
          averageOrderValue: { $avg: '$storeAmount' },
        },
      },
    ]);

    const averageOrderValue = result[0]?.averageOrderValue || 0;
    res.json({ averageOrderValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 7: Get Top Products Sold by a Store
 * GET /api/store/:storeId/top-products
 * Fetch top products sold by the store
 */
dashboardRouter.get('/store/:storeId/top-products', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          productName: { $first: '$items.productName' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.json(topProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route 8: Get Coupons Used for a Store
 * GET /api/store/:storeId/coupons
 * Fetch number of coupon codes used and total discount applied for a store
 */
dashboardRouter.get('/store/:storeId/coupons', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const result = await Order.aggregate([
      {
        $match: {
          'items.storeId': new mongoose.Types.ObjectId(storeId),
          'couponApplied.code': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$couponApplied.code',
          totalDiscount: { $sum: '$couponApplied.discount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.get('/store/:storeId/satisfaction-rate', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const result = await StoreProducts.find({ storeId }, { ratingSummary: 1 });

    const totalAverageRating = result.reduce(
      (acc, { ratingSummary: { averageRating } }) => {
        return (averageRating ?? 0) + acc;
      },
      0
    );

    const satisfactionRate = (totalAverageRating / result.length / 5) * 100;

    res.json(satisfactionRate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

dashboardRouter.get('/store/:storeId/revenue-charts', async (req, res) => {
  const { storeId } = req.params;

  if (!isValidObjectId(storeId))
    return res.status(400).send({ error: 'Invalid store ID' });

  try {
    const dailyRevenue = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
          revenue: { $sum: '$storeAmount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          },
          revenue: { $sum: '$storeAmount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const yearlyRevenue = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.storeId': new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: {
            year: { $dateToString: { format: '%Y', date: '$createdAt' } },
          },
          revenue: { $sum: '$storeAmount' },
        },
      },
      { $sort: { '_id.year': 1 } },
    ]);

    res.json({
      daily: dailyRevenue.map((item) => ({
        date: item._id.day,
        revenue: item.revenue,
      })),
      monthly: monthlyRevenue.map((item) => ({
        date: item._id.month,
        revenue: item.revenue,
      })),
      yearly: yearlyRevenue.map((item) => ({
        date: item._id.year,
        revenue: item.revenue,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default dashboardRouter;
