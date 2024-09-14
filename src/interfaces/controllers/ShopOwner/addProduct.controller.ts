import { Request, Response } from 'express';
import Products from '../../../infrastructure/database/models/ProductsSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';

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
    // Step 1: Check if the product already exists in the centralized collection
    let product = await Products.findOne({ name: name, brand: brand });

    // Step 2: If the product does not exist, add it to the centralized collection
    if (!product) {
      product = new Products({
        name: name,
        category: category,
        brand: brand,
        brandId: null, // Set BrandId accordingly if you manage brands elsewhere
        description: description,
      });
      await product.save();
    }

    // Step 3: Add the product to the store-specific collection
    const storeProduct = new StoreProducts({
      storeId: storeId,
      sku: sku,
      stock: stock,
      productId: product._id, // Link to the centralized product
      price: price,
      images: images,
      description: description,
      attributes: JSON.parse(attributes),
      specifications: JSON.parse(specifications),
      variants: JSON.parse(variants),
      status: status,
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
