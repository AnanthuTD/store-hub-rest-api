import mongoose, { Document, Schema } from 'mongoose';

export interface WishlistItem {
  productId: Schema.Types.ObjectId;
  addedAt: Date;
}

export interface WishlistDocument extends Document {
  userId: Schema.Types.ObjectId;
  items: WishlistItem[];
}

const WishlistItemSchema = new Schema<WishlistItem>({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'StoreProduct',
  },
  addedAt: { type: Date, default: Date.now },
});

const WishlistSchema = new Schema<WishlistDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  items: [WishlistItemSchema],
});

export const WishlistModel = mongoose.model<WishlistDocument>(
  'Wishlist',
  WishlistSchema
);
