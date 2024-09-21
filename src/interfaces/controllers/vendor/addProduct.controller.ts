import { Request, Response } from 'express';
import Products, {
  IProducts,
} from '../../../infrastructure/database/models/ProductsSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import Category from '../../../infrastructure/database/models/CategoryModel';
import Shop from '../../../infrastructure/database/models/ShopSchema';
import mongoose from 'mongoose';

export const addProductByVendor = async (req: Request, res: Response) => {
  const { name, productId, category, brand, description, status } = req.body;
  let { variants, existingImages } = req.body;

  // Parse incoming variants and images
  try {
    variants = JSON.parse(variants);
    existingImages = JSON.parse(existingImages || '[]');
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: 'Invalid variant or image data' });
  }

  if (!variants.length) {
    return res
      .status(400)
      .json({ message: 'At least one variant is required.' });
  }

  const ownerId = req.user?._id;
  if (!ownerId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Step 1: Retrieve storeId
    const shop = await Shop.findOne({ ownerId }, { _id: 1 });
    if (!shop) {
      return res.status(404).json({ message: 'Store not found' });
    }
    const storeId = shop._id;

    // Step 2: Handle image uploads
    const imageFiles = handleImageFiles(req, existingImages);

    // Step 3: Validate category
    const categoryDoc = await validateCategory(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    // Step 4: Create or update product in the centralized collection
    const [product, newVariants] = await findOrCreateProduct(
      productId,
      name,
      categoryDoc,
      brand,
      description,
      variants,
      imageFiles
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let variantStoreProducts = variants
      .filter((variant) => variant._id)
      .map((variant) => ({
        ...variant,
        variantId: variant._id,
      }));

    const newVariantStoreProducts = newVariants.map((variant) => ({
      ...variant,
      variantId: variant._id.toString(),
    }));

    updateProductVariants(product, variantStoreProducts);

    variantStoreProducts = [
      ...variantStoreProducts,
      ...newVariantStoreProducts,
    ];

    // Step 5: Add product to store-specific collection
    await addStoreProduct(
      storeId,
      product,
      categoryDoc,
      brand,
      description,
      variantStoreProducts,
      imageFiles,
      status
    );

    res.status(201).json({ message: 'Product added successfully to store' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding product' });
  }
};

// Helper function to handle image files
const handleImageFiles = (req: Request, existingImages: string[]): string[] => {
  let imageFiles: string[] = [];

  if (Array.isArray(req.files)) {
    imageFiles = req.files.map((file: any) => file.location);
  } else if (req.files && req.files.location) {
    imageFiles = [req.files.location];
  }

  return [...imageFiles, ...existingImages];
};

// Helper function to validate category
const validateCategory = async (categoryId: string) => {
  return await Category.findOne({ _id: categoryId });
};

// Helper function to find or create a product in the centralized collection
export const findOrCreateProduct = async (
  productId: string,
  name: string,
  categoryDoc: any,
  brand: string,
  description: string,
  variants: any[],
  images: string[]
) => {
  let product = productId ? await Products.findById(productId) : null;
  let newVariantsWithIds = [];

  if (!product) {
    // Create a new product in the centralized collection
    product = new Products({
      name,
      category: { name: categoryDoc.name, _id: categoryDoc._id },
      brand,
      description,
      variants: formatVariantsForCentralizedCollection(variants),
      images,
    });
    await product.save();
  } else {
    // Filter new variants without _id
    const newVariants = variants.filter((variant) => !variant._id);
    if (newVariants.length) {
      newVariantsWithIds = newVariants.map((variant) => ({
        ...variant,
        _id: new mongoose.Types.ObjectId(),
      }));
      product.variants.push(...newVariantsWithIds);
      await product.save();
    }
  }

  return [product, newVariantsWithIds];
};

// Helper function to add a product to the store-specific collection
const addStoreProduct = async (
  storeId: string,
  product: IProducts,
  categoryDoc: any,
  brand: string,
  description: string,
  variants: any[],
  images: string[],
  status: string
) => {
  const storeProduct = new StoreProducts({
    storeId,
    productId: product._id,
    name: product.name,
    category: { name: categoryDoc.name, _id: categoryDoc._id },
    brand,
    images,
    description,
    variants: formatVariantsForStoreCollection(variants),
    status,
    metadata: { purchases: 0, views: 0 },
    ratingSummary: { averageRating: null, totalReview: 0 },
  });

  await storeProduct.save();
};

// Helper function to format variants for the centralized product collection
const formatVariantsForCentralizedCollection = (variants: any[]) => {
  return variants.map((variant) => ({
    averagePrice: variant.price,
    availableShopsCount: 1,
    options: variant.options,
    specifications: variant.specifications,
  }));
};

// Helper function to format variants for the store-specific collection
const formatVariantsForStoreCollection = (variants: any[]) => {
  return variants.map((variant) => ({
    sku: variant.sku,
    price: variant.price,
    stock: variant.stock,
    variantId: variant.variantId,
    discountedPrice: variant.discountedPrice,
    isActive: true,
  }));
};

const updateProductVariants = async (product, variantStoreProducts) => {
  try {
    product.variants = product.variants.map((variant_1) => {
      const matchingVariant = variantStoreProducts.find(
        (variant) => variant.variantId === variant_1._id.toString()
      );

      if (matchingVariant) {
        // Calculate new available shops count
        const newAvailableShopsCount = variant_1.availableShopsCount + 1;

        // Calculate new average price using the formula
        const newAveragePrice =
          (variant_1.averagePrice * variant_1.availableShopsCount +
            matchingVariant.price) /
          newAvailableShopsCount;

        // Update the variant in the product's variants array
        return {
          ...variant_1,
          averagePrice: newAveragePrice,
          availableShopsCount: newAvailableShopsCount,
        };
      }

      // If no matching variant, return the original variant unchanged
      return variant_1;
    });

    // Save the updated product
    await product.save();

    console.log('Product variants updated successfully!');
  } catch (error) {
    console.error('Error updating product variants:', error);
  }
};
