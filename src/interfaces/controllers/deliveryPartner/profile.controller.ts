import { Request, Response } from 'express';
import { IDeliveryPartner } from '../../../domain/entities/DeliveryPartner';

export async function getProfile(req: Request, res: Response) {
  const partner = req.user as IDeliveryPartner;
  res.json({ id: partner._id, profile: partner?.profile });
}
