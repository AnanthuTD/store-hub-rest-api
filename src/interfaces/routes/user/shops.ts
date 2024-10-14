import express from 'express';
import { getNearbyShops } from '../../controllers/user/shops/getNearbyShops.controller';
import { getNearbyShopsWithProduct } from '../../controllers/user/shops/getNearbyShopsWithProduct.controller';
import Shop from '../../../infrastructure/database/models/ShopSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/nearby-with-product', getNearbyShopsWithProduct);
router.get('/nearby', getNearbyShops);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get('/:shopId/shop-details', async (req, res) => {
  const { shopId } = req.params;

  // Check for a valid shopId
  if (!shopId || !isValidObjectId(shopId)) {
    return res.status(400).json({ error: 'Invalid shop ID' });
  }

  try {
    const shop = await Shop.findById(shopId);

    // Check if shop exists
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:shopId/products', async (req, res) => {
  const { shopId } = req.params;

  // Check for a valid shopId
  if (!shopId || !isValidObjectId(shopId)) {
    return res.status(400).json({ error: 'Invalid shop ID' });
  }

  try {
    const products = await StoreProducts.find({ storeId: shopId });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
