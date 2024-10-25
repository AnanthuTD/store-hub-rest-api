import { Request, Response } from 'express';
import Shop from '../../../../infrastructure/database/models/ShopSchema';
import logger from '../../../../infrastructure/utils/logger';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';

export default async function fetchShops(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const ownerId = getRequestUserId(req);

    const stores = await Shop.find({ ownerId: ownerId }).select([
      '_id',
      'name',
    ]);
    res.status(200).json({ message: 'Shop data retired successfully', stores });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve shop data' });
    logger.error((error as Error).message);
    console.error(error);
  }
}
