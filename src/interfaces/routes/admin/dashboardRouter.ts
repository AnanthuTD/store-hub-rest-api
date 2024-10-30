import express, { Request, Response } from 'express';
import Order from '../../../infrastructure/database/models/OrderSchema';
import Shop from '../../../infrastructure/database/models/ShopSchema';
import { User } from '../../../infrastructure/database/models/UserSchema';
import DeliveryPartner from '../../../infrastructure/database/models/DeliveryPartner';
import ShopOwner from '../../../infrastructure/database/models/ShopOwnerModel';
import dayjs from 'dayjs';

const dashboardRouter = express.Router();

const getDateRange = (filter) => {
  const now = new Date();
  let startDate = null;

  switch (filter) {
    case 'daily':
      startDate = new Date(now.setUTCHours(0, 0, 0, 0)); // Midnight today
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - 7)); // 7 days ago
      break;
    case 'monthly':
      startDate = new Date(now.setMonth(now.getMonth() - 1)); // 1 month ago
      break;
    case 'yearly':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1)); // 1 year ago
      break;
    default:
      startDate = null; // No filter (i.e., return all)
  }

  return startDate;
};

dashboardRouter.get('/revenue', async (req: Request, res: Response) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const query = startDate ? { orderDate: { $gte: startDate } } : {};

    const orders = await Order.find(query);

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

      const orderProfit =
        order.totalAmount -
        (order.storeAmount +
          (order.deliveryFee ?? 0) +
          (order.platformFee ?? 0));

      totalProfit += orderProfit;
    });

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

dashboardRouter.get('/users', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const query = startDate ? { createdAt: { $gte: startDate } } : {};

    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments(query);

    res.json({ totalUsers, newUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

dashboardRouter.get('/orders', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const query = startDate ? { orderDate: { $gte: startDate } } : {};

    const totalOrders = await Order.countDocuments(query);
    const pendingOrders = await Order.countDocuments({
      ...query,
      deliveryStatus: 'Pending',
    });
    const cancelledOrders = await Order.countDocuments({
      ...query,
      deliveryStatus: 'Cancelled',
    });
    const deliveredOrders = await Order.countDocuments({
      ...query,
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

dashboardRouter.get('/top-stores', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

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
        $addFields: {
          orders: {
            $filter: {
              input: '$orders',
              as: 'order',
              cond: startDate ? { $gte: ['$$order.orderDate', startDate] } : {},
            },
          },
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

dashboardRouter.get('/top-products', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: startDate ? { orderDate: { $gte: startDate } } : {},
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({ topProducts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

dashboardRouter.get('/coupons-used', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const matchQuery: any = {
      'couponApplied.code': { $exists: true },
    };

    if (startDate) {
      matchQuery.orderDate = { $gte: startDate };
    }

    const couponsUsed = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$couponApplied.code',
          totalDiscount: { $sum: '$couponApplied.discount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ couponsUsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

dashboardRouter.get('/top-delivery-partners', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const matchQuery: any = {};
    if (startDate) {
      matchQuery.orderDate = { $gte: startDate };
    }

    const topDeliveryPartners = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$deliveryPartnerId',
          totalEarnings: { $sum: '$deliveryFee' },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'deliverypartners',
          localField: '_id',
          foreignField: '_id',
          as: 'deliveryPartner',
        },
      },
      { $unwind: '$deliveryPartner' },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          deliveryPartnerId: '$_id',
          name: {
            $concat: [
              '$deliveryPartner.firstName',
              ' ',
              '$deliveryPartner.lastName',
            ],
          },
          totalEarnings: 1,
          totalOrders: 1,
        },
      },
    ]);

    res.json({ topDeliveryPartners });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

dashboardRouter.get('/metrics', async (req, res) => {
  const { filter } = req.query;
  const startDate = getDateRange(filter);

  try {
    const match = {};
    if (startDate) {
      match.createdAt = { $gte: startDate }; // Match based on the createdAt field
    }

    // Aggregating total revenue over time
    const totalRevenue = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                filter === 'daily'
                  ? '%Y-%m-%d'
                  : filter === 'weekly'
                    ? '%Y-%U'
                    : filter === 'monthly'
                      ? '%Y-%m'
                      : '%Y', // yearly
              date: '$createdAt', // Ensure the date parameter is set correctly
            },
          },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Aggregating new users over time
    const newUsers = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                filter === 'daily'
                  ? '%Y-%m-%d'
                  : filter === 'weekly'
                    ? '%Y-%U'
                    : filter === 'monthly'
                      ? '%Y-%m'
                      : '%Y', // yearly
              date: '$createdAt', // Ensure the date parameter is set correctly
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Aggregating total orders over time
    const totalOrders = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                filter === 'daily'
                  ? '%Y-%m-%d'
                  : filter === 'weekly'
                    ? '%Y-%U'
                    : filter === 'monthly'
                      ? '%Y-%m'
                      : '%Y', // yearly
              date: '$createdAt', // Ensure the date parameter is set correctly
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Aggregating new vendors over time
    const newVendors = await ShopOwner.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                filter === 'daily'
                  ? '%Y-%m-%d'
                  : filter === 'weekly'
                    ? '%Y-%U'
                    : filter === 'monthly'
                      ? '%Y-%m'
                      : '%Y', // yearly
              date: '$createdAt', // Ensure the date parameter is set correctly
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Aggregating new delivery partners over time
    const newDeliveryPartners = await DeliveryPartner.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                filter === 'daily'
                  ? '%Y-%m-%d'
                  : filter === 'weekly'
                    ? '%Y-%U'
                    : filter === 'monthly'
                      ? '%Y-%m'
                      : '%Y',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Format the response to be more consumable by the frontend
    const formattedRevenue = totalRevenue.map((item) => ({
      date: item._id,
      total: item.total,
    }));
    const formattedNewUsers = newUsers.map((item) => ({
      date: item._id,
      count: item.count,
    }));
    const formattedTotalOrders = totalOrders.map((item) => ({
      date: item._id,
      count: item.count,
    }));
    const formattedNewVendors = newVendors.map((item) => ({
      date: item._id,
      count: item.count,
    }));
    const formattedNewDeliveryPartners = newDeliveryPartners.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.json({
      totalRevenue: formattedRevenue,
      newUsers: formattedNewUsers,
      totalOrders: formattedTotalOrders,
      newVendors: formattedNewVendors,
      newDeliveryPartners: formattedNewDeliveryPartners,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: error.message });
  }
});

dashboardRouter.get('/sales-report', async (req, res) => {
  const { startDate, endDate, reportType } = req.query;

  const matchCriteria = {};

  // Handle different report types
  if (reportType === 'custom') {
    matchCriteria.orderDate = {
      $gte: dayjs(startDate).startOf('day').toDate(),
      $lte: dayjs(endDate).endOf('day').toDate(),
    };
  } else if (reportType === 'daily') {
    matchCriteria.orderDate = {
      $gte: dayjs().startOf('day').toDate(),
      $lte: dayjs().endOf('day').toDate(),
    };
  } else if (reportType === 'monthly') {
    const startOfMonth = startDate
      ? dayjs(startDate).startOf('month')
      : dayjs().startOf('month');
    const endOfMonth = endDate
      ? dayjs(endDate).endOf('month')
      : dayjs().endOf('month');

    matchCriteria.orderDate = {
      $gte: startOfMonth.toDate(),
      $lte: endOfMonth.toDate(),
    };
  } else if (reportType === 'yearly') {
    const startOfYear = startDate
      ? dayjs(startDate).startOf('year')
      : dayjs().startOf('year');
    const endOfYear = endDate
      ? dayjs(endDate).endOf('year')
      : dayjs().endOf('year');

    matchCriteria.orderDate = {
      $gte: startOfYear.toDate(),
      $lte: endOfYear.toDate(),
    };
  }

  console.log('Match Criteria:', matchCriteria);

  try {
    const salesData = await Order.aggregate([
      { $match: matchCriteria },

      { $unwind: '$items' },

      {
        $addFields: {
          'items.storeId': { $toObjectId: '$items.storeId' }, // Convert to ObjectId
        },
      },

      {
        $lookup: {
          from: 'shops',
          localField: 'items.storeId',
          foreignField: '_id',
          as: 'storeInfo',
        },
      },

      {
        $unwind: '$storeInfo', // Unwind storeInfo to directly access the fields
      },

      {
        $group: {
          _id: {
            productId: '$items.productId',
            productName: '$items.productName',
            storeId: '$items.storeId',
            storeName: '$storeInfo.name', // Include store name here
            orderDate:
              reportType === 'daily'
                ? { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } }
                : reportType === 'monthly'
                  ? { $dateToString: { format: '%Y-%m', date: '$orderDate' } }
                  : reportType === 'yearly'
                    ? { $dateToString: { format: '%Y', date: '$orderDate' } }
                    : '$orderDate',
          },
          totalRevenue: { $sum: '$storeAmount' },
          totalDiscount: {
            $sum: {
              $cond: [
                { $gt: ['$couponApplied.discount', 0] },
                '$couponApplied.discount',
                0,
              ],
            },
          },
          totalPlatformFees: { $sum: '$platformFee' },
          totalQuantity: { $sum: '$items.quantity' },
          totalOrders: { $sum: 1 },
        },
      },

      {
        $project: {
          _id: 0,
          productId: '$_id.productId',
          productName: '$_id.productName',
          storeId: '$_id.storeId',
          storeName: '$_id.storeName', // Project store name in output
          orderDate: '$_id.orderDate',
          totalRevenue: 1,
          totalDiscount: 1,
          totalPlatformFees: 1,
          totalQuantity: 1,
          totalOrders: 1,
        },
      },

      { $sort: { orderDate: 1 } },
    ]);

    // Calculate aggregated metrics based on filtered sales data
    const totalSales = salesData.reduce(
      (acc, sale) => acc + sale.totalRevenue,
      0
    );
    const totalDiscountsGiven = salesData.reduce(
      (acc, sale) => acc + sale.totalDiscount,
      0
    );
    const totalPlatformFeesCollected = salesData.reduce(
      (acc, sale) => acc + sale.totalPlatformFees,
      0
    );
    const totalUniqueProducts = new Set(salesData.map((sale) => sale.productId))
      .size;

    // Return the response with the correct metrics and filtered sales data
    res.json({
      success: true,
      reportType,
      totalSales,
      totalDiscountsGiven,
      totalPlatformFeesCollected,
      totalUniqueProducts,
      salesData,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'An error occurred while generating the report' });
  }
});

export default dashboardRouter;
