import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface ICategory extends Document {
  _id: ObjectId;
  parentCategory: ObjectId | null;
  name: string;
  status: string;
  description: string;
  imageUrl: string;
}

const CategorySchema: Schema = new Schema(
  {
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    name: { type: String, required: true, unique: true },
    status: { type: String, required: true, enum: ['active', 'inactive'] },
    description: { type: String, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
