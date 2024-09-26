import { Request, Response } from 'express';
import {
  isValidLatitude,
  isValidLongitude,
} from '../../../../infrastructure/utils/location';
import Shop from '../../../../infrastructure/database/models/ShopSchema';
import { getCoordinates } from '../../../../infrastructure/utils/getCoordinates';

export const getNearbyShops = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, city } = await getCoordinates(req);

    const limit = 10;
    const distance = 10000; // in meters

    let nearbyShops = [];

    if (!(isValidLongitude(longitude) && isValidLatitude(latitude))) {
      nearbyShops = await Shop.find()
        .sort({ rating: -1 })
        .limit(limit)
        .projection({
          name: 1,
          location: 1,
          distance: { $literal: null },
          rating: 1,
          city: '$address.city',
        });
    } else {
      // Try to find nearby shops, incrementally increase distance if no shops are found
      nearbyShops = await Shop.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude as number, latitude as number],
            },
            distanceField: 'distance',
            maxDistance: distance,
            spherical: true,
          },
        },
        {
          $project: {
            name: 1,
            location: 1,
            distance: 1,
            rating: 1,
            city: '$address.city',
          },
        },
      ])
        .limit(limit)
        .sort({ rating: 1 });

      // If still no nearby shops are found, return top-rated shops
      if (!nearbyShops.length) {
        // Only fetch the top-rated shops if the first query fails
        const topRatedShops = await Shop.aggregate([
          {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [longitude as number, latitude as number],
              },
              distanceField: 'distance',
              maxDistance: 99999,
              spherical: true,
            },
          },
          {
            $project: {
              name: 1,
              location: 1,
              distance: 1,
              rating: 1,
              city: '$address.city',
            },
          },
        ])
          .sort({ rating: -1 })
          .limit(limit);

        if (!topRatedShops.length) {
          return res
            .status(404)
            .json({ message: 'No nearby or top-rated shops found!' });
        }

        return res.status(200).json({
          message: 'No nearby shops found, returning top-rated shops.',
          shops: topRatedShops,
        });
      }
    }

    // Return the nearby shops with the product
    res.status(200).json({
      city,
      shops: nearbyShops,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'An error occurred while fetching nearby shops' });
  }
};
