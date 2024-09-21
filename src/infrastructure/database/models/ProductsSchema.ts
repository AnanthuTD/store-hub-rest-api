import mongoose, { Schema, Document, ObjectId } from 'mongoose';

// Define the interface for variant-specific specifications
export interface IVariantSpecification {
  key: string; // e.g., "Weight", "Battery Life"
  value: string; // e.g., "200g", "12 hours"
}

// Define the interface for dynamic variant options
export interface IVariantOption {
  key: string; // e.g., "Size", "Color", "Storage"
  value: string; // e.g., "M", "Red", "128GB"
}

// Define the interface for a product variant
export interface IVariant {
  _id: ObjectId;
  options: IVariantOption[]; // Dynamic variant options like size, color, etc.
  specifications?: IVariantSpecification[];
  averagePrice: number;
  availableShopsCount: number;
}

// Define the interface for a product document with variants
export interface IProducts extends Document {
  _id: ObjectId;
  description: string | null;
  category: ObjectId | null;
  name: string | null;
  brand: string | null;
  brandId: ObjectId | null;
  images: string[];
  rating: number;
  popularity: number;
  variants: IVariant[];
}

// Define an embedded schema for variant-specific specifications
const VariantSpecificationSchema: Schema = new Schema({
  key: { type: String, required: false },
  value: { type: String, required: false },
});

// Define an embedded schema for dynamic variant options
const VariantOptionSchema: Schema = new Schema({
  key: { type: String, required: true }, // e.g., "Size", "Color"
  value: { type: String, required: true }, // e.g., "M", "Red"
});

// Embedded schema for variants
const VariantSchema: Schema = new Schema({
  options: {
    type: [VariantOptionSchema],
    required: true,
    validate: [
      (val: any[]) => val.length > 0,
      'At least one variant option is required',
    ],
  },
  specifications: {
    type: [VariantSpecificationSchema],
    required: false,
  },
  averagePrice: { type: Number, required: true },
  availableShopsCount: { type: Number, required: true, default: 0 },
});

const ProductsSchema: Schema = new Schema(
  {
    description: { type: String },
    category: { type: Schema.Types.ObjectId },
    name: { type: String },
    brand: { type: String },
    popularity: { type: Number },
    rating: { type: Number },
    images: {
      type: [{ type: String }],
      validate: [
        (val: string[]) => val.length > 0,
        'At least one image is required',
      ],
    },
    variants: {
      type: [VariantSchema],
      validate: [
        (val: any[]) => val.length > 0,
        'At least one variant is required',
      ],
    },
  },
  { timestamps: true }
);

ProductsSchema.index({ name: 'text', description: 'text' });

const Products = mongoose.model<IProducts>('Products', ProductsSchema);

export default Products;
