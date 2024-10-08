import { Request, Response } from 'express';
import { checkHomeDeliveryAvailability } from '../../../application/usecases/CheckHomeDeliveryAvailability';
import { CartRepository } from '../../../infrastructure/repositories/CartRepository';
import { ShopRepository } from '../../../infrastructure/repositories/ShopRepository';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';

const cartRepository = new CartRepository();
const shopRepository = new ShopRepository();

export async function checkDeliveryController(req: Request, res: Response) {
  try {
    const { userId, latitude, longitude } = req.body;
    const deliveryLocation = { latitude, longitude };

    const result = await checkHomeDeliveryAvailability(
      userId,
      deliveryLocation,
      10000,
      cartRepository,
      shopRepository
    );

    // Get product IDs for unavailable (not near) and available (near) products
    const unavailableProductIds = result.notNearProducts.map(
      (product) => product.productId
    );

    const availableProductIds = result.nearProducts.map(
      (product) => product.productId
    );

    // Fetch the unavailable products' details
    const unavailableProducts = await StoreProducts.find(
      { _id: { $in: unavailableProductIds } },
      { name: 1, images: 1 }
    ).lean();

    // Fetch the available products' details
    const availableProducts = await StoreProducts.find(
      { _id: { $in: availableProductIds } },
      { name: 1, images: 1 }
    ).lean();

    // Send the response with both lists of products
    res.status(200).json({ unavailableProducts, availableProducts });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
