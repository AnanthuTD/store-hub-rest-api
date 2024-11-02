import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle: string;
  imageUrl?: string;
  link?: string;
  buttonText?: string;
  startDate: Date;
  endDate: Date;
}

const bannerSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  imageUrl: String,
  link: String,
  buttonText: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

export default mongoose.model<IBanner>('Banner', bannerSchema);
