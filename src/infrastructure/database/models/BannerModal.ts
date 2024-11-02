import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  imageUrl?: string;
  link?: string;
  startDate: Date;
  endDate: Date;
}

const bannerSchema: Schema = new Schema({
  title: { type: String, required: true },
  imageUrl: String,
  link: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

export default mongoose.model<IBanner>('Banner', bannerSchema);
