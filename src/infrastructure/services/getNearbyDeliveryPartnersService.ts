import redisClient from '../redis/redisClient';

interface GetNearbyDeliveryPartnersProps {
  latitude: number | string;
  longitude: number | string;
  radius: number;
  unit?: 'm' | 'km' | 'mi' | 'ft';
}

interface Partner {
  partnerId: string;
  distance: string;
}

interface GetNearbyDeliveryPartnersResult {
  success: boolean;
  partners?: Partner[];
  message?: string;
}

/**
 * Retrieves nearby delivery partners based on the provided geographical coordinates and radius.
 *
 * @param latitude - The latitude of the location to search from.
 * @param longitude - The longitude of the location to search from.
 * @param radius - The radius within which to search for delivery partners.
 * @param unit - The unit of measurement for the radius (default is 'm').
 *
 * @returns An object containing the success status, an array of nearby delivery partners (if any),
 * and an appropriate message.
 */
export async function getNearbyDeliveryPartners({
  latitude,
  longitude,
  radius,
  unit = 'm',
}: GetNearbyDeliveryPartnersProps): Promise<GetNearbyDeliveryPartnersResult> {
  if (!latitude || !longitude || !radius || radius <= 0) {
    return {
      success: false,
      message: 'Latitude, longitude, and a positive radius are required!',
    };
  }

  const lat = parseFloat(latitude as string);
  const long = parseFloat(longitude as string);

  if (isNaN(lat) || isNaN(long)) {
    return { success: false, message: 'Invalid latitude or longitude values!' };
  }

  try {
    // Retrieve nearby delivery partners using Redis GEORADIUS
    const nearbyPartners = (await redisClient.georadius(
      'delivery-partners',
      long,
      lat,
      radius,
      unit,
      'WITHDIST'
    )) as string[][]; // Redis returns a 2D array of partnerId and distance

    // Log the raw response
    console.log(nearbyPartners);

    // Check if any partners were found
    if (nearbyPartners.length === 0) {
      return {
        success: true,
        partners: [],
        message: 'No delivery partners found nearby.',
      };
    }

    // Format results into an array of partnerId and distance
    const formattedResults: Partner[] = nearbyPartners.map(
      ([partnerId, distance]) => ({
        partnerId,
        distance,
      })
    );

    return {
      success: true,
      partners: formattedResults,
    };
  } catch (error) {
    console.error('Error retrieving nearby delivery partners:', error);
    return {
      success: false,
      message:
        'Failed to retrieve nearby delivery partners due to internal error.',
    };
  }
}
