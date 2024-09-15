import { Request, Response } from 'express';
import Products from '../../../infrastructure/database/models/ProductsSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import Category from '../../../infrastructure/database/models/CategoryModel';

// Add product by vendor
export const addProductByVendor = async (req: Request, res: Response) => {
  const {
    name,
    category,
    brand,
    storeId,
    sku,
    stock,
    price,
    description,
    attributes,
    specifications,
    variants,
    status,
  } = req.body;

  console.log(req.body);

  let images: string[] = [];

  if (Array.isArray(req.files)) {
    images = req.files.map((file) => file.location);
  }

  try {
    // Step 1: Check if the category exists
    const categoryDoc = await Category.findOne({ _id: category });

    if (!categoryDoc) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    // Step 2: Check if the product already exists in the centralized collection
    let product = await Products.findOne({ name, brand });

    // Step 3: If the product does not exist, add it to the centralized collection
    if (!product) {
      product = new Products({
        name,
        category: { name: categoryDoc.name, _id: categoryDoc._id }, // Store category details
        brand,
        brandId: null, // Set BrandId accordingly if you manage brands elsewhere
        description,
      });
      await product.save();
    }

    // Step 4: Add the product to the store-specific collection
    const storeProduct = new StoreProducts({
      storeId,
      sku,
      stock,
      productId: product._id, // Link to the centralized product
      name: product.name,
      category: { name: categoryDoc.name, _id: categoryDoc._id }, // Store category details
      brand,
      price,
      images,
      description,
      attributes: JSON.parse(attributes),
      specifications: JSON.parse(specifications),
      variants: JSON.parse(variants),
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { purchases: 0, views: 0 },
      ratingSummary: { averageRating: null, totalReview: 0 },
      discountedPrice: null, // You can handle discount logic separately
    });

    await storeProduct.save();

    res.status(201).json({ message: 'Product added successfully to store' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding product' });
  }
};
