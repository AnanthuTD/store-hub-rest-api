import { Request, Response } from 'express';
import Products, {
  IProducts,
} from '../../../infrastructure/database/models/ProductsSchema';
import StoreProducts from '../../../infrastructure/database/models/StoreProducts';
import Category from '../../../infrastructure/database/models/CategoryModel';
import Shop from '../../../infrastructure/database/models/ShopSchema';

export const addProductByVendor = async (req: Request, res: Response) => {
  const {
    name,
    productId,
    category,
    brand,
    sku,
    stock,
    price,
    description,
    attributes,
    specifications,
    variants,
    status,
  } = req.body;

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

    // Step 2: Handle images
    let imagesFiles: string[] = [];
    if (Array.isArray(req.files)) {
      imagesFiles = req.files.map((file: any) => file.location); // Adjust according to your file handling
    } else if (req.files && req.files.location) {
      imagesFiles = [req.files.location]; // Handle single file case
    }

    // const images = imageFiles?.map((file) => file.location) || [];

    // Step 3: Check if the category exists
    const categoryDoc = await Category.findOne({ _id: category });
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Category does not exist' });
    }

    // Step 4: Check if the product already exists in the centralized collection

    let product: null | IProducts = null;
    if (productId) product = await Products.findById(productId);

    // Step 5: If the product does not exist, add it to the centralized collection
    if (!product) {
      product = new Products({
        name,
        category: { name: categoryDoc.name, _id: categoryDoc._id }, // Store category details
        brand,
        brandId: null, // Set BrandId accordingly if you manage brands elsewhere
        description,
        attributes: JSON.parse(attributes || '[]'),
        specifications: JSON.parse(specifications || '[]'),
        variants: JSON.parse(variants || '[]'),
        images: imagesFiles,
      });
      await product.save();
    } else {
      // Step 3: Compare and update centralized product fields
      // let updateRequired = false;
      // Check and merge variants
      /*  if (variants) {
        const newVariants = JSON.parse(variants);
        mergeByKey(product.variants, newVariants, 'key', 'value'); // Replace 'key' and 'value' with the actual field names
        updateRequired = true;
      } */
      // Check and merge attributes
      /* if (attributes) {
        const newAttributes = JSON.parse(attributes);
        mergeByKey(product.attributes, newAttributes, 'key', 'value'); // Replace 'key' and 'value' with the actual field names
        updateRequired = true;
      } */
      // Check and merge specifications
      /* if (specifications) {
        const newSpecifications = JSON.parse(specifications);
        mergeByKey(product.specifications, newSpecifications, 'key', 'value'); // Replace 'key' and 'value' with the actual field names
        updateRequired = true;
      } */
      // Save the product if any updates were made
      /* if (updateRequired) {
        await product.save();
      } */
    }

    // Step 6: Add the product to the store-specific collection
    const storeProduct = new StoreProducts({
      storeId,
      sku,
      stock,
      productId: product._id, // Link to the centralized product
      name: product.name,
      category: { name: categoryDoc.name, _id: categoryDoc._id }, // Store category details
      brand,
      price,
      images: imagesFiles,
      description,
      attributes: JSON.parse(attributes || '[]'),
      specifications: JSON.parse(specifications || '[]'),
      variants: JSON.parse(variants || '[]'),
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

// Helper function to merge arrays of objects by key, ensuring no duplicate values in the value
/* function mergeByKey(
  existingArray: any[],
  newArray: any[],
  keyField: string,
  valueField: string
) {
  newArray.forEach((newItem) => {
    const existingItem = existingArray.find(
      (item) => item[keyField] === newItem[keyField]
    );

    if (existingItem) {
      // If the key exists, merge new values into the existing array without duplicates
      if (Array.isArray(existingItem[valueField])) {
        newItem[valueField].forEach((newValue: any) => {
          if (!existingItem[valueField].includes(newValue)) {
            existingItem[valueField].push(newValue);
          }
        });
      } else {
        // If the value field is not an array yet, turn it into one and add unique values
        existingItem[valueField] = [
          ...(existingItem[valueField] || []),
          ...newItem[valueField].filter(
            (newValue: any) =>
              !existingItem[valueField] ||
              !existingItem[valueField].includes(newValue)
          ),
        ];
      }
    } else {
      // If the key doesn't exist, add the new item to the array
      existingArray.push(newItem);
    }
  });
} */
