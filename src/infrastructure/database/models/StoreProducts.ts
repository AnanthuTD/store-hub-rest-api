import mongoose, { Schema, Document } from 'mongoose';

// Define an embedded schema for attributes
const AttributeSchema: Schema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

// Define an embedded schema for specifications
const SpecificationSchema: Schema = new Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
});

// Define an embedded schema for variants
const VariantSchema: Schema = new Schema({
  key: { type: String, required: true },
  value: { type: [String], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // New field to handle soft delete
});

// Define an embedded schema for category
const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  _id: { type: Schema.Types.ObjectId, required: true },
});

interface IStoreProduct extends Document {
  storeId: string;
  sku: string;
  stock: number;
  productId: mongoose.Types.ObjectId;
  name: string;
  category: { name: string; _id: mongoose.Types.ObjectId };
  brand: string;
  price: number;
  images: string[];
  description: string;
  attributes: { key: string; value: string }[];
  specifications: { key: string; value: string }[];
  variants: { key: string; value: string[]; status: string }[];
  status: 'active' | 'inactive' | 'archived'; // Enum type for status
  createdAt: Date;
  updatedAt: Date;
  metadata: { purchases: number; views: number };
  ratingSummary: { averageRating: number | null; totalReview: number };
  discountedPrice: number | null;
}

const StoreProductSchema: Schema<IStoreProduct> = new Schema({
  storeId: { type: String, required: true, index: true }, // Index for efficient querying
  sku: { type: String, required: true, index: true }, // Index SKU
  stock: { type: Number, required: true },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  }, // Index productId
  name: { type: String, required: true },
  category: { type: CategorySchema },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  images: {
    type: [{ type: String }],
    validate: [
      (val: string[]) => val.length > 0,
      'At least one image is required',
    ], // Validation for at least one image
  },
  description: { type: String, required: true },
  attributes: {
    type: [AttributeSchema],
    validate: [
      (val: { key: string; value: string }[]) => val.length > 0,
      'At least one attribute is required',
    ],
  },
  specifications: {
    type: [SpecificationSchema],
    validate: [
      (val: { key: string; value: string }[]) => val.length > 0,
      'At least one specification is required',
    ],
  },
  variants: {
    type: [VariantSchema],
    validate: [
      (val: { key: string; value: string[] }[]) => val.length > 0,
      'At least one variant is required',
    ],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'], // Enum for status field
    required: true,
    default: 'active',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: {
    purchases: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  ratingSummary: {
    averageRating: { type: Number, default: null },
    totalReview: { type: Number, default: 0 },
  },
  discountedPrice: { type: Number, default: null },
});

// Add indexes for optimizing search queries
StoreProductSchema.index({ storeId: 1, sku: 1 });
StoreProductSchema.index({ productId: 1 });

// Export the StoreProduct model
export default mongoose.model<IStoreProduct>(
  'StoreProduct',
  StoreProductSchema
);
