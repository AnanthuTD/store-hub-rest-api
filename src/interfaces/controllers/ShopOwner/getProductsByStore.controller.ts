// src/interfaces/controllers/ShopOwner/getProductsByStore.controller.ts

import { Request, Response } from 'express';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';

export const getProductsByStore = async (req: Request, res: Response) => {
  const { storeId } = req.params;

  try {
    const products = await StoreProducts.find({ storeId });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};
