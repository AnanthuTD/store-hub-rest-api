import Cart from '../../../infrastructure/database/models/CartSchema';
import { calculateDeliveryCharge } from '../../../infrastructure/services/calculateDeliveryChargeService';
import { getRequestUserId } from '../../../infrastructure/utils/authUtils';

export const getDeliveryCharge = async (req, res) => {
  const { userLat, userLng } = req.query;
  const userId = getRequestUserId(req);

  // Fetch the cart and populate the storeId field for each product
  const cart = await Cart.findOne({ userId: userId }).populate(
    'products.storeId'
  );

  // Check if cart exists
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  // Ensure there are products in the cart
  if (cart.products.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  // Get the store's location for the first product (you can customize this)
  const storeLocation = cart.products[0]?.storeId?.location?.coordinates;
  if (!storeLocation || !userLat || !userLng) {
    return res
      .status(400)
      .json({ message: 'Invalid or missing location data' });
  }

  const [storeLng, storeLat] = storeLocation; // Store location is [lng, lat] format

  try {
    // Calculate the delivery charge using the store and user locations
    const deliveryCharge = await calculateDeliveryCharge(
      `${storeLat},${storeLng}`,
      `${userLat},${userLng}`
    );

    // Return the rounded delivery charge
    return res.status(200).json({
      deliveryCharge: Math.round(deliveryCharge),
    });
  } catch (error) {
    console.error('Error calculating delivery charge:', error);
    return res.status(500).json({
      message: 'These products are not deliverable to the selected location.',
    });
  }
};
