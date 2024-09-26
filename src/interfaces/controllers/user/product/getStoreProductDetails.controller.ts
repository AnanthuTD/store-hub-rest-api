import { Request, Response } from 'express';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';

export default async function getStoreProductDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { productId } = req.params;

    const product = await StoreProducts.findById(productId)
      .populate('productId', 'variants')
      .lean();

    if (
      product &&
      product.variants &&
      product.productId &&
      product.productId.variants
    ) {
      const updatedVariants = product.variants.map((variant) => {
        // Find the corresponding centralized product variant by matching IDs
        const centralizedVariant = product.productId.variants.find(
          (centralized) =>
            centralized._id.toString() === variant.variantId.toString()
        );

        return {
          ...variant, // Spread original variant properties
          centralizedData: centralizedVariant || null, // Include centralized variant data if found
        };
      });

      product.variants = updatedVariants;
      product.productId = product.productId._id;
    } else {
      console.error('Product or variants not found');
    }

    res.status(200).json({ product, message: 'Product found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}
