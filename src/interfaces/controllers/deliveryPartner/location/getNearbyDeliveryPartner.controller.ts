import { Request, Response } from 'express';
import { getNearbyDeliveryPartners } from '../../../../infrastructure/services/getNearbyDeliveryPartnersService';

export async function getNearbyDeliveryPartnersController(
  req: Request,
  res: Response
) {
  try {
    const { longitude, latitude, radius, unit } = req.query;

    const result = await getNearbyDeliveryPartners({
      longitude: longitude as string,
      latitude: latitude as string,
      radius: parseFloat(radius as string),
      unit: (unit as 'm' | 'km' | 'mi' | 'ft') || 'm',
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getNearbyDeliveryPartnersController:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Could not retrieve delivery partners.',
    });
  }
}
