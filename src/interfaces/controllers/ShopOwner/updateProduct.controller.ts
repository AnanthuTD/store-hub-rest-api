import { Request, Response } from 'express';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import { deleteFromS3 } from '../../../infrastructure/s3Client';
import env from '../../../infrastructure/env/env';
import Category from '../../../infrastructure/database/models/CategoryModel';

export const updateProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const {
    variants,
    existingImages,
    category,
    attributes,
    specifications,
    status,
    sku,
    description,
    price,
    stock,
  } = req.body;

  // Handle file uploads
  const imageFiles = req.files as Express.Multer.File[];
  const images = imageFiles?.map((file) => file.location) || [];

  try {
    const product = await StoreProducts.findById(productId);

    console.log(product);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields with correct formats
    if (category) {
      const categoryObject = await Category.findById(JSON.parse(category)); // Await here to resolve the promise
      if (categoryObject) {
        product.category = {
          _id: categoryObject._id,
          name: categoryObject.name,
        };
      } else {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
    }

    if (attributes) {
      product.attributes = JSON.parse(attributes); // Ensure this is an array of objects
    }

    if (specifications) {
      product.specifications = JSON.parse(specifications); // Ensure this is an array of objects
    }

    if (status) {
      const validStatuses = ['active', 'inactive']; // List valid statuses as per your schema
      if (!validStatuses.includes(JSON.parse(status))) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      product.status = JSON.parse(status);
    }

    // Handle variant updates
    if (variants) {
      const updatedVariants = JSON.parse(variants);

      // Set status to 'inactive' for missing variants
      product.variants = product.variants.map((existingVariant: any) => {
        const isVariantPresent = updatedVariants.some(
          (variant) => variant._id === existingVariant._id.toString()
        );
        if (!isVariantPresent) {
          existingVariant.status = 'inactive';
        }
        return existingVariant;
      });

      // Add new variants
      const existingVariantIds = product.variants.map((variant: any) =>
        variant._id.toString()
      );

      updatedVariants.forEach((newVariant) => {
        if (!existingVariantIds.includes(newVariant._id)) {
          product.variants.push(newVariant);
        }
      });
    }

    // Handle image updates
    const existingImageUrls = new Set(JSON.parse(existingImages || '[]'));
    const imagesToDelete = product.images.filter(
      (image) => !existingImageUrls.has(image)
    );

    // Delete images from S3 bucket
    for (const image of imagesToDelete) {
      const imageKey = image.split('/').pop();
      if (imageKey) {
        await deleteFromS3(env.S3_BUCKET_NAME, imageKey);
      }
    }

    // Update product images
    product.images = [...existingImageUrls, ...images];

    const updates: any = {};

    // Parse and check each field individually
    if (typeof sku === 'string' && sku.trim()) {
      updates.sku = JSON.parse(sku).trim();
    }

    if (typeof description === 'string' && description.trim()) {
      updates.description = JSON.parse(description).trim();
    }

    if (!isNaN(Number(price)) && Number(price) > 0) {
      updates.price = Number(price);
    }

    if (!isNaN(Number(stock)) && Number(stock) >= 0) {
      updates.stock = Number(stock);
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    // Merge valid fields with the product
    Object.assign(product, updates);

    await product.save();

    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};