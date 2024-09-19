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
    res.status(400).json({ message: 'Invalid variant or image data' });
    console.log(error);
    return;
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
    // Step 1: Retrieve the storeId
    const shop = await Shop.findOne({ ownerId }, { _id: 1 });
    if (!shop) {
      return res.status(404).json({ message: 'Store not found' });
    }
    const storeId = shop._id;

    // Step 2: Handle image uploads
    const imageFiles = handleImageFiles(req, existingImages);

    // Step 3: Validate the category
    const categoryDoc = await validateCategory(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    // Step 4: Handle product creation or update in the centralized collection
    const [product, newVariants]: null | IProducts = await findOrCreateProduct(
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

    console.log('product variants:', product.variants);

    let variantStoreProducts = variants.map((variant) => {
      if (variant._id)
        return {
          ...variant,
          variantId: variant._id, // Use the variant's _id from the centralized product
        };
    });

    variantStoreProducts = variantStoreProducts.filter((variant) => !!variant);

    const newVariantStoreProducts = newVariants.map((variant) => ({
      ...variant,
      variantId: variant._id.toString(),
    }));

    console.log('newVariant stores:', newVariantStoreProducts);

    variantStoreProducts = [
      ...variantStoreProducts,
      ...newVariantStoreProducts,
    ];

    console.log('variantStoreProducts', variantStoreProducts);

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
    imageFiles = req.files.map((file: any) => file.location); // Adjust this based on your file handling logic
  } else if (req.files && req.files.location) {
    imageFiles = [req.files.location]; // Handle single file case
  }

  return [...imageFiles, ...existingImages];
};

// Helper function to validate category
const validateCategory = async (categoryId: string) => {
  return await Category.findOne({ _id: categoryId });
};

// Helper function to find or create a product in the centralized collection
const findOrCreateProduct = async (
  productId: string,
  name: string,
  categoryDoc: any,
  brand: string,
  description: string,
  variants: any[],
  images: string[]
) => {
  let product = null;
  let newVariantsWithIds = [];

  if (productId) {
    product = await Products.findById(productId);
  }

  if (!product) {
    // Create a new product in the centralized collection
    product = new Products({
      name,
      category: { name: categoryDoc.name, _id: categoryDoc._id },
      brand,
      brandId: null, // Assuming brandId is not used here
      description,
      variants: formatVariantsForCentralizedCollection(variants),
      images,
    });
    await product.save();
  } else {
    // Step 1: Filter out the new variants (those without _id)
    const newVariants = variants.filter((variant) => !variant._id);

    if (newVariants.length) {
      // Step 1: Generate _id for each new variant
      newVariantsWithIds = newVariants.map((variant) => ({
        ...variant,
        _id: new mongoose.Types.ObjectId(), // Generate _id
      }));

      // Step 2: Push these variants to the product
      product.variants.push(...newVariantsWithIds);

      // Step 3: Save the product
      await product.save();

      console.log('Newly generated variant _id values:', newVariantsWithIds);
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
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: { purchases: 0, views: 0 },
    ratingSummary: { averageRating: null, totalReview: 0 },
  });

  await storeProduct.save();
};

// Helper function to format variants for the centralized product collection
const formatVariantsForCentralizedCollection = (variants: any[]) => {
  return variants.map((variant) => ({
    sku: variant.sku,
    price: variant.price,
    discountedPrice: variant.discountedPrice,
    stock: variant.stock,
    options: variant.variantOptions, // Keep detailed variant options
    specifications: variant.specifications, // Any additional specifications
  }));
};

// Helper function to format variants for the store-specific collection
const formatVariantsForStoreCollection = (variants: any[]) => {
  return variants.map((variant) => ({
    sku: variant.sku,
    price: variant.price,
    stock: variant.stock,
    options: variant.variantOptions,
    variantId: variant.variantId,
  }));
};
