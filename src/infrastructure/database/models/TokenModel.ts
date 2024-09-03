import mongoose, { Schema, Document } from 'mongoose';

interface IToken extends Document {
  email: string;
  token: string;
  expiresAt: Date;
}

const tokenSchema: Schema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Create a TTL index on the expiresAt field
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenModel = mongoose.model<IToken>('Token', tokenSchema);

export default TokenModel;
