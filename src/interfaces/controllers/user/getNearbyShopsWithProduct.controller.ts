import { Request, Response } from 'express';
import {
  isValidLatitude,
  isValidLongitude,
} from '../../../infrastructure/utils/location';
import Shop from '../../../infrastructure/database/models/ShopSchema';

export const getNearbyShopsWithProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { latitude, longitude, productId, maxDistance = 10000 } = req.body;

    if (!longitude || !latitude) {
      return res
        .status(400)
        .json({ error: 'Latitude and Longitude are required' });
    }

    if (!(isValidLongitude(longitude) || isValidLatitude(latitude))) {
      return res.status(400).json({ error: 'Invalid Latitude and Longitude' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const nearbyShops = await Shop.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: maxDistance,
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'storeproducts',
          let: { shopId: '$_id', productId: { $toObjectId: productId } }, // Use let to define both variables
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$storeId', '$$shopId'] },
                  ],
                },
              },
            },
          ],
          as: 'storeProductDetails',
        },
      },
      {
        $match: {
          'storeProductDetails.0': { $exists: true }, // Ensure there's at least one matching product
        },
      },
      {
        $project: {
          name: 1,
          location: 1,
          distance: 1,
          storeProductDetails: 1,
        },
      },
    ]).sort({ distance: 1 });

    // If no shops are found
    if (!nearbyShops.length) {
      return res
        .status(404)
        .json({ message: 'No nearby shops found with the selected product' });
    }

    // Return the nearby shops with the selected product
    res.status(200).json(nearbyShops);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'An error occurred while fetching nearby shops' });
  }
};
