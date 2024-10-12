import axios from 'axios';
import env from '../env/env';

const BASE_FEE = 25; // Base fee for up to 3 km
const ADDITIONAL_CHARGE_PER_KM = 0.5;
const BASE_DISTANCE_KM = 3; // Distance up to which the base fee applies

// Function to calculate distance using Google Maps Distance Matrix API
export async function getDistanceBetweenLocations(storeLocation, userLocation) {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${storeLocation}&destinations=${userLocation}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const distanceInMeters = response.data.rows[0].elements[0].distance.value;
    const distanceInKm = distanceInMeters / 1000; // Convert meters to kilometers
    return distanceInKm;
  } catch (error) {
    console.error('Error fetching distance from Google Maps API:', error);
    return null;
  }
}

// Function to calculate delivery charge
export async function calculateDeliveryCharge(storeLocation, userLocation) {
  const distance = await getDistanceBetweenLocations(
    storeLocation,
    userLocation
  );

  if (distance === null) {
    throw new Error('Unable to calculate distance');
  }

  let deliveryCharge = BASE_FEE;

  if (distance > BASE_DISTANCE_KM) {
    const additionalDistance = distance - BASE_DISTANCE_KM;
    deliveryCharge += additionalDistance * ADDITIONAL_CHARGE_PER_KM;
  }

  return deliveryCharge;
}
