import { Request, Response } from 'express';
import { addDeliveryPartner } from '../../../../infrastructure/services/addDeliveryPartnerGeoService';

/**
 * Controller to handle adding a delivery partner to the Redis geospatial index.
 *
 * @param req - The Express request object, which should contain `longitude`, `latitude`, and `deliveryPartnerId` in the body.
 * @param res - The Express response object used to send back the result of the operation.
 */
export async function updateDeliveryPartnerController(
  req: Request,
  res: Response
) {
  const { longitude, latitude, deliveryPartnerId } = req.body;

  // Validate that all required fields are present
  if (!longitude || !latitude || !deliveryPartnerId) {
    return res.status(400).json({
      success: false,
      message: 'Longitude, latitude, and deliveryPartnerId are required!',
    });
  }

  try {
    // Call the service function to add the delivery partner
    const result = await addDeliveryPartner({
      longitude,
      latitude,
      deliveryPartnerId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Send success response
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in addDeliveryPartnerController:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
}
