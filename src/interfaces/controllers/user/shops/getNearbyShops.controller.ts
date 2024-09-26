import { Request, Response } from 'express';
import {
  isValidLatitude,
  isValidLongitude,
} from '../../../../infrastructure/utils/location';
import Shop from '../../../../infrastructure/database/models/ShopSchema';
import axios from 'axios';

const getCityFromCoordinates = async (latitude, longitude) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  try {
    const response = await axios.get(url);
    return (
      response.data.address.city ||
      response.data.address.town ||
      response.data.address.village
    ); // City or nearby town/village
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
  }
};

// Helper function to fetch location from IP using ip-api
const getLocationFromIP = async (ip: string) => {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const { lat, lon, city } = response.data;
    if (lat && lon) {
      return { latitude: lat, longitude: lon, city };
    }
    return null;
  } catch (error) {
    console.error('Error fetching location from IP:', error);
    return null;
  }
};

export const getNearbyShops = async (req: Request, res: Response) => {
  try {
    let { latitude, longitude } = req.query;
    let city = null;

    const limit = 10;
    const distance = 10000; // in meters

    if (!latitude || !longitude) {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      // TODO: Remove this on production. Used to set the ip when on local server
      ip =
        ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'
          ? '103.160.233.240'
          : ip;

      const location = await getLocationFromIP(ip as string);

      if (location) {
        latitude = location.latitude;
        longitude = location.longitude;
        city = location.city;
      }
    } else {
      city = await getCityFromCoordinates(latitude, longitude);
    }

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
      longitude = Number(longitude);
      latitude = Number(latitude);

      // Try to find nearby shops, incrementally increase distance if no shops are found
      nearbyShops = await Shop.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
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
              near: { type: 'Point', coordinates: [longitude, latitude] },
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
