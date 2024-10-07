import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import env from '../env/env';

const client = new Client({});

interface DirectionRequest {
  originLocation: string;
  destinationLocation: string;
  travelMode?: TravelMode;
}

export async function getDirections({
  originLocation,
  destinationLocation,
  travelMode = TravelMode.driving,
}: DirectionRequest) {
  try {
    const response = await client.directions({
      params: {
        origin: originLocation,
        destination: destinationLocation,
        mode: travelMode,
        key: env.GOOGLE_MAPS_API_KEY,
      },
    });

    console.log(response.data.routes);

    return response.data;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw new Error('Failed to fetch directions');
  }
}
