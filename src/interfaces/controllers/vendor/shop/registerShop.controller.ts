import { Request, Response } from 'express';
import Shop, {
  IShop,
} from '../../../../infrastructure/database/models/ShopSchema';
import logger from '../../../../infrastructure/utils/logger';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';

export default async function registerShop(
  req: Request,
  res: Response
): Promise<void> {
  const data: IShop = req.body;

  // Store shop data in the database
  try {
    data.ownerId = getRequestUserId(req);
    const shopData = await Shop.create({ ...data, isVerified: false });
    shopData.save();
    res.status(201).json({ message: 'Shop created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create shop' });
    logger.error((error as Error).message);
    console.error(error);
  }
}
