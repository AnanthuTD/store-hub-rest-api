import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface ITransaction extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: Date;
}

const TransactionSchema: Schema<ITransaction> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'date', updatedAt: false },
  }
);

TransactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
