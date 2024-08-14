import mongoose, { Document, Schema } from 'mongoose';
import { IToken } from '../../../domain/entities/Token';

const TokenSchema: Schema = new Schema({
  email: {
    type: Schema.Types.String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

interface ITokenDocument extends IToken, Document {}

const TokenModel = mongoose.model<ITokenDocument>('Token', TokenSchema);

export default TokenModel;
