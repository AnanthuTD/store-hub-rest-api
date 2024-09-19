import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IProducts extends Document {
  _id: ObjectId;
  description: string | null;
  category: ObjectId | null;
  name: string | null;
  brand: string | null;
  brandId: ObjectId | null;
  attributes: { key: string; value: string }[];
  specifications: { key: string; value: string }[];
  variants: { key: string; value: string[]; status: string }[];
  images: string[];
  rating: number;
  popularity: number;
}

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

const ProductsSchema: Schema = new Schema(
  {
    description: { type: String },
    category: { type: Schema.Types.ObjectId },
    name: { type: String },
    brand: { type: String },
    // brandId: { type: Schema.Types.ObjectId },
    popularity: { type: Number },
    rating: { type: Number },
    images: {
      type: [{ type: String }],
      validate: [
        (val: string[]) => val.length > 0,
        'At least one image is required',
      ], // Validation for at least one image
    },
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
  },
  { timestamps: true }
);

ProductsSchema.index({ name: 'text', description: 'text' });

const Products = mongoose.model<IProducts>('Products', ProductsSchema);

export default Products;
