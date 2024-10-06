import axios from 'axios';
import env from '../env/env';
import logger from '../utils/logger';

const fieldMasksArray = [
  'routes.duration',
  'routes.distanceMeters',
  'routes.polyline.encodedPolyline',
  'routes.legs.steps.polyline.encodedPolyline',
  'routes.legs.steps.endLocation',
  'routes.legs.steps.startLocation',
  'routes.legs.polyline',
  'routes.optimizedIntermediateWaypointIndex',
  'routes.legs',
];

const fieldMasks = fieldMasksArray.join(',');

const axiosInstance = axios.create({
  baseURL: 'https://routes.googleapis.com/directions/v2:computeRoutes',
  headers: {
    'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY,
    'X-Goog-FieldMask': fieldMasks,
  },
});

export const TravelMode = {
  WALK: 'WALK',
  DRIVE: 'DRIVE',
} as const;

type TravelModeType = keyof typeof TravelMode;

interface FetchDirectionProps {
  originLocation: { latitude: number; longitude: number };
  destinationLocation: { latitude: number; longitude: number };
  waypoints?: { latitude: number; longitude: number }[];
  travelMode?: TravelModeType;
}

// In-memory cache object for directions
const directionsCache: { [key: string]: any } = {};

export class GoogleRoutesService {
  fetchDirections = async ({
    originLocation,
    destinationLocation,
    waypoints = [],
    travelMode = TravelMode.DRIVE,
  }: FetchDirectionProps) => {
    try {
      // Generate cache key based on origin, destination, waypoints, and travel mode
      const cacheKey = `${JSON.stringify(originLocation)}_${JSON.stringify(destinationLocation)}_${JSON.stringify(waypoints)}_${travelMode.toLowerCase()}`;

      // Check if directions are cached
      if (directionsCache[cacheKey]) {
        console.log('Using cached directions');
        return directionsCache[cacheKey];
      }

      // Convert waypoints to the "intermediates" format
      const intermediates = waypoints.map((waypoint) => ({
        location: {
          latLng: {
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
          },
        },
      }));

      const response = await axiosInstance.post('/', {
        origin: {
          location: {
            latLng: {
              latitude: originLocation.latitude,
              longitude: originLocation.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
            },
          },
        },
        intermediates: intermediates,
        travelMode: travelMode,
        optimizeWaypointOrder: 'true',
      });

      // Cache the response data
      directionsCache[cacheKey] = response.data;

      return response.data;
    } catch (error) {
      console.error('Error fetching directions:', error);
      if (axios.isAxiosError(error))
        logger.error('Error fetching directions:', error.response?.data);
      throw new Error('Failed to fetch directions. Please try again later.');
    }
  };
}
