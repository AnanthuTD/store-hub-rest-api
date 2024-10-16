import { Schema, model, Document } from 'mongoose';

interface Review extends Document {
  productId: string; // The ID of the product being reviewed
  userId: string; // The ID of the user who submitted the review
  rating: number; // Rating from 1 to 5
  message: string; // Review message
  createdAt: Date; // Date of review creation
}

const reviewSchema = new Schema<Review>({
  productId: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ReviewModel = model<Review>('Review', reviewSchema);

export default ReviewModel;
