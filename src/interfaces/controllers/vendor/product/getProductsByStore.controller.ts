// src/interfaces/controllers/ShopOwner/getProductsByStore.controller.ts

import { Request, Response } from 'express';
import StoreProducts from '../../../../infrastructure/database/models/StoreProducts';
import Products from '../../../../infrastructure/database/models/ProductsSchema';

export const getProductsByStore = async (req: Request, res: Response) => {
  const { storeId } = req.params;

  try {
    // Step 1: Fetch store products for the given storeId
    const storeProducts = await StoreProducts.find({ storeId }).lean();

    if (!storeProducts.length) {
      return res
        .status(404)
        .json({ message: 'No products found for this store' });
    }

    // Step 2: Create an array of product IDs from the store products
    const productIds = storeProducts.map(
      (storeProduct) => storeProduct.productId
    );

    // Step 3: Fetch products from the centralized collection using the product IDs
    const products = await Products.find({ _id: { $in: productIds } }).lean();

    // Step 4: Merge the variant details from the centralized products into the store products
    const enrichedProducts = storeProducts.map((storeProduct) => {
      const matchingProduct = products.find(
        (product) =>
          product._id.toString() === storeProduct.productId.toString()
      );

      if (matchingProduct) {
        // Map the variants from the store product to the full variant data from the centralized product
        const enrichedVariants = storeProduct.variants.map((storeVariant) => {
          const matchingVariant = matchingProduct.variants.find(
            (variant) =>
              variant._id.toString() === storeVariant.variantId.toString()
          );

          console.log('matching product variants: ', matchingVariant);
          console.log('store variant: ', storeVariant);

          return {
            ...storeVariant,
            ...(matchingVariant || {}), // Merge the detailed variant data if found
          };
        });

        return {
          ...storeProduct,
          variants: enrichedVariants,
        };
      }

      return storeProduct;
    });

    // Step 5: Return the enriched products with full variant details
    res.status(200).json(enrichedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};
