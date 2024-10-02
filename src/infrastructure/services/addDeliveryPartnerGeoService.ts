import redisClient from '../redis/redisClient';

interface AddDeliveryPartnerProps {
  longitude: number | string;
  latitude: number | string;
  deliveryPartnerId: string;
}

const ttl = 3600; // 1 hour in seconds
const DELIVERY_PARTNER_LOCATION_KEY = 'delivery-partner:location';

/**
 * Adds a delivery partner to the Redis geospatial index.
 *
 * @param longitude - The longitude of the delivery partner's location.
 * @param latitude - The latitude of the delivery partner's location.
 * @param deliveryPartnerId - The unique identifier of the delivery partner.
 *
 * @returns An object with a success flag and a message indicating the outcome of the operation.
 * - If successful, the success flag is true and the message is 'Delivery partner added successfully!'.
 * - If unsuccessful due to missing parameters, invalid values, or an internal error, the success flag is false and the message provides details about the failure.
 */
export async function addDeliveryPartner({
  longitude,
  latitude,
  deliveryPartnerId,
}: AddDeliveryPartnerProps) {
  if (!longitude || !latitude || !deliveryPartnerId)
    return {
      success: false,
      message: 'longitude, latitude, deliveryPartnerId are required!',
    };

  const long = parseFloat(longitude as string);
  const lat = parseFloat(latitude as string);

  // check if number
  if (isNaN(long) || isNaN(lat)) {
    return { success: false, message: 'Invalid longitude or latitude values!' };
  }

  // Check if longitude and latitude are within valid range (between -180 and 180, -90 and 90)
  if (long < -180 || long > 180 || lat < -90 || lat > 90) {
    return {
      success: false,
      message:
        'Longitude must be between -180 and 180, latitude must be between -90 and 90!',
    };
  }

  try {
    // Add delivery partner to the Redis geospatial index
    await redisClient.geoadd(
      DELIVERY_PARTNER_LOCATION_KEY,
      long,
      lat,
      deliveryPartnerId
    );

    // remove inactive delivery partner location information
    await redisClient.expire(DELIVERY_PARTNER_LOCATION_KEY, ttl);

    return { success: true, message: 'Delivery partner added successfully!' };
  } catch (error) {
    console.error('Error adding delivery partner to Redis:', error);
    return {
      success: false,
      message: 'Failed to add delivery partner due to internal error.',
    };
  }
}
