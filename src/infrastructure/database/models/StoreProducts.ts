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
});

interface IStoreProduct extends Document {
  storeId: string;
  sku: string;
  stock: number;
  productId: mongoose.Types.ObjectId;
  price: number;
  images: string[];
  description: string;
  attributes: { key: string; value: string }[];
  specifications: { key: string; value: string }[];
  variants: { key: string; value: string[] }[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: { purchases: number; views: number };
  ratingSummary: { averageRating: number | null; totalReview: number };
  discountedPrice: number | null;
}

const StoreProductSchema: Schema<IStoreProduct> = new Schema({
  storeId: { type: String, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  description: { type: String, required: true },
  attributes: [AttributeSchema],
  specifications: [SpecificationSchema],
  variants: [VariantSchema],
  status: { type: String, required: true },
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

export default mongoose.model<IStoreProduct>(
  'StoreProduct',
  StoreProductSchema
);
