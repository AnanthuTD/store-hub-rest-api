export const isValidLatitude = (latitude) => {
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

export const isValidLongitude = (longitude) => {
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};
