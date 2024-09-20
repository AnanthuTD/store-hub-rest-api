import { Request, Response } from 'express';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import mongoose from 'mongoose';

export default async function getShopsByProductsController(
  req: Request,
  res: Response
): Promise<void> {
  const { productId, variantId } = req.params;

  if (!productId || !variantId) {
    res.status(400).json({ error: 'Missing productId or variantId' });
    return;
  }

  const productObjectId = new mongoose.Types.ObjectId(productId);
  const variantObjectId = new mongoose.Types.ObjectId(variantId);

  try {
    // MongoDB aggregation to join store products with shops
    const result = await StoreProducts.aggregate([
      {
        // Match the productId and variantId
        $match: {
          productId: productObjectId,
          'variants.variantId': variantObjectId,
        },
      },
      {
        // Perform a lookup to join with the Shop collection based on shopId
        $lookup: {
          from: 'shops', // The collection name of shops in your MongoDB
          localField: 'storeId', // Field in StoreProducts
          foreignField: '_id', // Field in the Shop collection
          as: 'shop', // The resulting field containing shop details
        },
      },
      {
        // Unwind the shop array (since $lookup creates an array)
        $unwind: '$shop',
      },
      {
        // Optionally, project specific fields if you don't need everything
        $project: {
          _id: 1,
          productId: 1,
          variant: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$variants', // the variants array
                  as: 'variant',
                  cond: {
                    $and: [
                      { $eq: ['$$variant.variantId', variantObjectId] }, // Filter by variantId
                      { $eq: ['$$variant.isActive', true] }, // Ensure isActive is true
                    ],
                  },
                },
              },
              0,
            ],
          },
          shop: {
            _id: 1,
            name: 1,
            address: 1,
            // Include other fields you need from the Shop collection
          },
        },
      },
    ]);

    // If no products found, return 404
    if (!result.length) {
      res.status(404).json({
        message: 'No products found for this productId and variantId',
      });
      return;
    }

    // Send the result with both product and shop details
    res.status(200).json({ result });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      error: 'An error occurred while retrieving the products and shops',
    });
    console.error(error);
  }
}
