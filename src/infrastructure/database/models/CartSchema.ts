import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface ICart extends Document {
  _id: ObjectId;
  userId: ObjectId;
  products: {
    productId: ObjectId;
    quantity: number;
    variantId: ObjectId;
    storeId: ObjectId;
  }[];
}

const CartSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'StoreProduct',
      },
      quantity: { type: Number, required: true, default: 0 },
      variantId: { type: Schema.Types.ObjectId, required: true },
      storeId: { type: Schema.Types.ObjectId, required: true, ref: 'Shop' },
    },
  ],
});

const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
