import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IProducts extends Document {
  _id: ObjectId;
  description: string | null;
  category: ObjectId | null;
  name: string | null;
  brand: string | null;
  brandId: ObjectId | null;
}

const ProductsSchema: Schema = new Schema(
  {
    description: { type: String },
    category: { type: Schema.Types.ObjectId },
    name: { type: String },
    brand: { type: String },
    // brandId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const Products = mongoose.model<IProducts>('Products', ProductsSchema);

export default Products;
