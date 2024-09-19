import { Request, Response } from 'express';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import { deleteFromS3 } from '../../../infrastructure/s3Client';
import env from '../../../infrastructure/env/env';
import Category from '../../../infrastructure/database/models/CategoryModel';
import Products from '../../../infrastructure/database/models/ProductsSchema';
import mongoose from 'mongoose';

export const updateProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { variants, existingImages, category, status, description } = req.body;
  const imageFiles = req.files as Express.Multer.File[];
  const images = imageFiles?.map((file) => file.location) || [];

  try {
    const storeProduct = await StoreProducts.findById(productId);

    if (!storeProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const centralizedProduct = await Products.findById(storeProduct.productId);
    if (!centralizedProduct) {
      return res.status(404).json({ message: 'Centralized product not found' });
    }

    if (category) {
      await updateCategory(storeProduct, JSON.parse(category));
    }

    if (status) {
      await updateStatus(storeProduct, JSON.parse(status));
    }

    const newVariants = await findOrCreateProductVariants(
      centralizedProduct,
      JSON.parse(variants)
    );

    const updatedVariants = mergeVariants(
      storeProduct.variants,
      JSON.parse(variants),
      newVariants
    );

    storeProduct.variants = updatedVariants;

    await handleImageUpdates(storeProduct, existingImages, images);

    const updates = {
      description: typeof description === 'string' ? description.trim() : '',
      updatedAt: new Date(),
    };

    Object.assign(storeProduct, updates);

    await storeProduct.save();

    res.status(200).json(storeProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

const updateCategory = async (storeProduct: any, categoryId: string) => {
  const categoryObject = await Category.findById(categoryId);
  if (categoryObject) {
    storeProduct.category = {
      _id: categoryObject._id,
      name: categoryObject.name,
    };
  } else {
    throw new Error('Invalid category ID');
  }
};

const updateStatus = async (storeProduct: any, status: string) => {
  const validStatuses = ['active', 'inactive'];
  if (validStatuses.includes(status)) {
    storeProduct.status = status;
  } else {
    throw new Error('Invalid status value');
  }
};

const findOrCreateProductVariants = async (
  product: string,
  variants: any[]
) => {
  let newVariantsWithIds = [];

  if (product) {
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

  return newVariantsWithIds;
};

const mergeVariants = (
  existingVariants: any[],
  updatedVariants: any[],
  newVariants: any[]
) => {
  let updated = existingVariants.map((variant) => {
    const updatedVariant = updatedVariants.find(
      (v) => v._id.toString() === variant._id.toString()
    );
    if (updatedVariant) {
      return updatedVariant;
    }
    return { ...variant, isActive: false };
  });

  newVariants = newVariants.map((variant) => ({
    ...variant,
    variantId: variant._id,
  }));

  updated = [...updated, ...newVariants];

  return updated;
};

const handleImageUpdates = async (
  storeProduct: any,
  existingImages: string | undefined,
  newImages: string[]
) => {
  const existingImageUrls = new Set(JSON.parse(existingImages || '[]'));
  const imagesToDelete = storeProduct.images.filter(
    (image: string) => !existingImageUrls.has(image)
  );

  for (const image of imagesToDelete) {
    const imageKey = image.split('/').pop();
    if (imageKey) {
      await deleteFromS3(env.S3_BUCKET_NAME, imageKey);
    }
  }

  storeProduct.images = [...existingImageUrls, ...newImages];
};
