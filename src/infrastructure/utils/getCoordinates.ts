import { Request } from 'express';
import { getCityFromCoordinates, getLocationFromIP } from './location';

// Define the return type for the function
interface Coordinates {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  city: string | null | undefined;
}

// Helper function to get coordinates from request or fallback to IP location
export async function getCoordinates(req: Request): Promise<Coordinates> {
  let {
    latitude,
    longitude,
    city,
  }: {
    latitude?: string | number | null;
    longitude?: string | number | null;
    city?: string;
  } = req.body;

  // Convert latitude and longitude to numbers if they are provided as strings
  latitude = latitude ? parseFloat(latitude as string) : null;
  longitude = longitude ? parseFloat(longitude as string) : null;

  // If latitude or longitude are missing, use IP to get location
  if (!latitude || !longitude) {
    let ip =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    // Fallback to a default IP for local server (development environment only)
    ip =
      ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'
        ? '103.160.233.240'
        : ip;

    // Get location from IP address
    const location = await getLocationFromIP(ip);

    if (location) {
      latitude = location.latitude;
      longitude = location.longitude;
      city = location.city;
    }
  }

  // If we already have latitude and longitude, get the city from coordinates
  if (latitude && longitude && !city) {
    city = await getCityFromCoordinates(latitude, longitude);
  }

  return { latitude, longitude, city };
}
