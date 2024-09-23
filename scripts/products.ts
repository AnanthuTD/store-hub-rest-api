// @ts-expect-error
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import Category from '../src/infrastructure/database/models/CategoryModel';
import Products from '../src/infrastructure/database/models/ProductsSchema';
import StoreProducts from '../src/infrastructure/database/models/StoreProducts';
import Shop, { IShop } from '../src/infrastructure/database/models/ShopSchema';
import { generateDummyShopOwners } from './shopOwner';

// Number of categories to create
const NUM_PARENT_CATEGORIES = 20; // Updated to 20 parent categories
const NUM_CHILD_CATEGORIES_PER_PARENT = 10; // Updated to 10 child categories per parent category
const NUM_PRODUCTS = 50; // Updated to 50 products per child category for better variety
const NUM_STORE_PRODUCTS = 10; // Updated to 10 store products per centralized product for more diversity
const NUM_VARIANTS = 5; // Updated to 5 variants per product for broader customer choices
const NUM_SHOP_OWNERS = 20;

// Function to create dummy categories
async function createCategories() {
  try {
    const categories = [];

    // Fetch all existing parent categories
    const existingParents = await Category.find({ parentCategory: null });

    // Create parent categories if not enough exist
    const numParentsToCreate = NUM_PARENT_CATEGORIES - existingParents.length;

    for (let i = 0; i < numParentsToCreate; i++) {
      const categoryName = faker.commerce.department();

      // Check if parent category already exists
      let savedParent = await Category.findOne({ name: categoryName });

      if (!savedParent) {
        const parentCategory = new Category({
          name: categoryName,
          status: 'active',
          description: faker.lorem.sentence(),
          imageUrl: `https://picsum.photos/200/${categoryName.split(' ').join(',')}`,
          parentCategory: null, // This ensures it's a parent category
        });

        // Save the new parent category
        savedParent = await parentCategory.save();
        existingParents.push(savedParent);
        categories.push(savedParent);
      }
    }

    // Now create child categories for each parent category
    for (const parent of existingParents) {
      for (let j = 0; j < NUM_CHILD_CATEGORIES_PER_PARENT; j++) {
        const childCategoryName = `${parent.name} ${faker.commerce.product()}`;

        // Check if child category already exists under the same parent
        let savedChild = await Category.findOne({
          name: childCategoryName,
          parentCategory: parent._id,
        });

        if (!savedChild) {
          const childCategory = new Category({
            parentCategory: parent._id, // Assign the parent category
            name: childCategoryName,
            status: 'active',
            description: faker.lorem.sentence(),
            imageUrl: `https://picsum.photos/200?random=${parent._id}${j}`,
          });

          // Save the child category
          savedChild = await childCategory.save();
          categories.push(savedChild);
        }
      }
    }

    console.log(`${categories.length} categories inserted.`);
    return categories;
  } catch (error) {
    console.error('Error inserting categories:', error);
  }
}

// Function to create products using categories
async function addCentralizedProducts(categories) {
  try {
    const dummyProducts = [];

    for (let i = 0; i < NUM_PRODUCTS; i++) {
      const randomCategory = faker.helpers.arrayElement(categories); // Randomly choose a category

      const variants = [];
      for (let j = 0; j < NUM_VARIANTS; j++) {
        const variant = {
          options: [
            { key: 'Size', value: faker.helpers.arrayElement(['S', 'M', 'L']) },
            { key: 'Color', value: faker.color.human() },
          ],
          specifications: [
            {
              key: 'Weight',
              value: `${faker.number.int({ min: 100, max: 1000 })}g`,
            },
            {
              key: 'Battery Life',
              value: `${faker.number.int({ min: 5, max: 20 })} hours`,
            },
          ],
          averagePrice: faker.commerce.price(),
          availableShopsCount: faker.number.int({ min: 1, max: 10 }),
        };
        variants.push(variant);
      }

      const productName = faker.commerce.productName();
      const images = Array.from({ length: 4 }, () =>
        faker.image.urlLoremFlickr({
          height: 1500,
          width: 1500,
          category: `${randomCategory.name.split(' ')[0]}`,
        })
      );

      const product = new Products({
        name: productName,
        description: faker.commerce.productDescription(),
        category: { name: randomCategory.name, _id: randomCategory._id }, // Use the randomly chosen category
        brand: faker.company.name(),
        images,
        rating: faker.number.int({ min: 1, max: 5 }),
        popularity: faker.number.int({ min: 0, max: 1000 }),
        variants,
      });

      dummyProducts.push(product);
    }

    const insertedProducts = await Products.insertMany(dummyProducts);
    console.log(`${insertedProducts.length} centralized products inserted.`);
    return insertedProducts;
  } catch (error) {
    console.error('Error inserting products:', error);
  }
}

// Function to add store-specific products
async function addStoreProducts(centralizedProducts, shops: []) {
  try {
    const dummyStoreProducts = [];

    for (const product of centralizedProducts) {
      for (let i = 0; i < NUM_STORE_PRODUCTS; i++) {
        const randomShop = faker.helpers.arrayElement(shops);
        const storeVariants = product.variants.map((variant) => ({
          variantId: variant._id, // Reference to the centralized product variant
          sku: faker.string.alphanumeric(10),
          price: faker.commerce.price(),
          discountedPrice: faker.datatype.boolean()
            ? faker.commerce.price()
            : null,
          stock: faker.number.int({ min: 0, max: 100 }),
          metadata: {
            purchases: faker.number.int({ min: 0, max: 100 }),
            views: faker.number.int({ min: 0, max: 1000 }),
          },
          isActive: true,
        }));

        const storeProduct = new StoreProducts({
          storeId: randomShop._id, // Random store ID
          productId: product._id, // Reference to the centralized product
          name: product.name, // Store-specific product name can be customized
          category: product.category, // Inherit from the centralized product
          brand: product.brand,
          description: product.description,
          images: product.images,
          status: 'active',
          variants: storeVariants,
          ratingSummary: {
            averageRating: faker.number.int({ min: 1, max: 5 }),
            totalReview: faker.number.int({ min: 0, max: 100 }),
          },
        });

        dummyStoreProducts.push(storeProduct);
      }
    }

    const insertedStoreProducts =
      await StoreProducts.insertMany(dummyStoreProducts);

    insertedStoreProducts.forEach(async ({ _id, storeId }) => {
      await Shop.updateOne(
        { _id: storeId }, // Match the correct store by its ID
        { $push: { products: _id } } // Push the product _id into the 'products' array
      );
    });
    console.log(`${insertedStoreProducts.length} store products inserted.`);
  } catch (error) {
    console.error('Error inserting store products:', error);
  }
}

// Function to generate a random latitude within Kerala's bounds
function latitude({
  max = 12.77, // Max latitude for Kerala
  min = 8.18, // Min latitude for Kerala
  precision = 4,
}: {
  max?: number;
  min?: number;
  precision?: number;
} = {}): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(precision));
}

// Function to generate a random longitude within Kerala's bounds
function longitude({
  max = 77.86, // Max longitude for Kerala
  min = 74.86, // Min longitude for Kerala
  precision = 4,
}: {
  max?: number;
  min?: number;
  precision?: number;
} = {}): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(precision));
}

const generateRandomShop = (shopOwner): any => {
  return {
    name: faker.company.name(),
    location: {
      latitude: latitude(), // Latitude within Kerala
      longitude: longitude(), // Longitude within Kerala
    },
    products: [], // Assuming you will reference products later
    ownerId: shopOwner._id, // Generate a random ObjectId
    averageRating: faker.number.float({ min: 0, max: 5, fractionDigits: 2 }),
    categories: faker.helpers.arrayElement(['electronics', 'clothing']),
    isVerified: true,
    address: {
      city: faker.location.city(),
      country: faker.location.country(),
      postalCode: faker.location.zipCode(),
      state: faker.location.state(),
      street: faker.location.streetAddress(),
    },
    description: faker.lorem.sentence(),
    contactInfo: {
      email: faker.internet.email(),
      phone: faker.phone.number(),
      website: faker.internet.url(),
    },
    operatingHours: {
      friday: '9:00 AM - 9:00 PM',
      monday: '9:00 AM - 9:00 PM',
      saturday: '9:00 AM - 9:00 PM',
      sunday: '9:00 AM - 9:00 PM',
      thursday: '9:00 AM - 9:00 PM',
      tuesday: '9:00 AM - 9:00 PM',
      wednesday: '9:00 AM - 9:00 PM',
    },
    images: Array.from({ length: 4 }, () =>
      faker.image.urlLoremFlickr({
        height: 1500,
        width: 1500,
        category: `shop, store`,
      })
    ),
  };
};

const generateShops = async (shopOwners): Promise<IShop | []> => {
  try {
    const shopPromises = Array.from({ length: 30 }, () => {
      const randomShopOwner = faker.helpers.arrayElement(shopOwners);
      const shopData = generateRandomShop(randomShopOwner);
      const shop = new Shop(shopData);
      return shop.save();
    });

    const shops = await Promise.all(shopPromises);
    console.log('20 shops created successfully');
    return shops;
  } catch (err) {
    console.error('Error creating shops:', err);
    return [];
  }
};

// Main function to execute the script
async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/storehub-test');

    // Step 1: Insert categories
    const categories = await createCategories();

    const shopOwners = await generateDummyShopOwners(NUM_SHOP_OWNERS);

    const shops = await generateShops(shopOwners);

    // Step 2: Insert centralized products using the created categories
    const centralizedProducts = await addCentralizedProducts(categories);

    // Step 3: Insert store-specific products based on the centralized products
    if (centralizedProducts) {
      await addStoreProducts(centralizedProducts, shops);
    }

    console.log('Dummy data insertion complete.');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    // await mongoose.disconnect();
  }
}

// Run the main function
main();
