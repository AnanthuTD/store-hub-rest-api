import axios from 'axios';

export const isValidLatitude = (latitude) => {
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

export const isValidLongitude = (longitude) => {
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

export const getCityFromCoordinates = async (latitude, longitude) => {
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
export const getLocationFromIP = async (ip: string) => {
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
