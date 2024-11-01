import { Request, Response } from 'express';
import Shop, {
  IShop,
} from '../../../../infrastructure/database/models/ShopSchema';
import logger from '../../../../infrastructure/utils/logger';
import { getRequestUserId } from '../../../../infrastructure/utils/authUtils';
import ShopOwner from '../../../../infrastructure/database/models/ShopOwnerModel';

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
    await ShopOwner.updateOne(
      { _id: shopData.ownerId },
      { $push: { stores: shopData._id } }
    );
    res.status(201).json({ message: 'Shop created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create shop' });
    logger.error((error as Error).message);
    console.error(error);
  }
}
