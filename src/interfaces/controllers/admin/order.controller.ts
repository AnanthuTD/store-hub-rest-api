import { Request, Response } from 'express';
import Order from '../../../infrastructure/database/models/OrderSchema';

export const getOrders = async (req: Request, res: Response) => {
  try {
    // Fetch only the necessary fields for displaying in the list
    const orders = await Order.find(
      {},
      {
        _id: 1,
        orderDate: 1,
        deliveryStatus: 1,
        deliveryPartnerName: 1,
        deliveryFee: 1,
      }
    )
      .sort({ orderDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
    });
  }
};

// Get detailed delivery information for a specific order
export const getOrderDeliveryDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Extracting only the relevant delivery details
    const deliveryDetails = {
      orderId: order._id,
      orderDate: order.orderDate,
      deliveryStatus: order.deliveryStatus,
      deliveryPartner: {
        partnerId: order.deliveryPartnerId,
        partnerName: order.deliveryPartnerName,
      },
      deliveryLocation: order.deliveryLocation,
      shippingAddress: order.shippingAddress || 'Not Provided',
      deliveryFee: order.deliveryFee,
      platformFee: order.platformFee,
      deliveryOTP: order.deliveryOTP || null,
    };

    return res.status(200).json({
      success: true,
      data: deliveryDetails,
    });
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching delivery details',
    });
  }
};
