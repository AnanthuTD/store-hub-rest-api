import { Request, Response } from 'express';
import Shop from '../../../infrastructure/database/models/ShopSchema';

export default async function updateShopData(req: Request, res: Response) {
  const shopId = req.params.shopId;
  const updatedData = req.body;

  try {
    const updatedShop = await Shop.findByIdAndUpdate(shopId, updatedData, {
      new: true,
    });
    if (!updatedShop) {
      res
        .status(400)
        .json({ message: 'Shop not found! Please try registering' });
    } else {
      res.status(200).json(updatedShop);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update shop data' });
  }
}
