import { ObjectId } from 'mongoose';
import TransactionSchema, {
  ITransaction,
} from '../database/models/TransactionSchema';

export default class TransactionRepository {
  /**
   * Retrieves a list of transactions for a specific user.
   *
   * @param userId - The unique identifier of the user. It can be either a string or an ObjectId.
   * @returns A promise that resolves to an array of {@link ITransaction} objects representing the transactions.
   */
  async getTransactionsForUser(
    userId: string | ObjectId
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({ userId });
  }

  /**
   * Retrieves a transaction by its unique identifier.
   *
   * @param transactionId - The unique identifier of the transaction. It can be either a string or an ObjectId.
   * @returns A promise that resolves to an {@link ITransaction} object representing the transaction, or `null` if no transaction is found.
   */
  async getTransaction(
    transactionId: string | ObjectId
  ): Promise<ITransaction | null> {
    return await TransactionSchema.findById(transactionId);
  }

  /**
   * Creates a new transaction.
   *
   * @param transactionData - The data for the new transaction.
   * @returns A promise that resolves to the created {@link ITransaction} object.
   */
  async createTransaction(transactionData: ITransaction) {
    const newTransaction = new TransactionSchema(transactionData);
    return await newTransaction.save();
  }

  /**
   * Updates a transaction by its unique identifier.
   *
   * @param transactionId - The unique identifier of the transaction.
   * @param transactionData - The partial data to update.
   * @returns A promise that resolves to the updated {@link ITransaction} object.
   */
  async updateTransaction(
    transactionId: string | ObjectId,
    transactionData: Partial<ITransaction>
  ) {
    return await TransactionSchema.findByIdAndUpdate(
      transactionId,
      transactionData,
      {
        new: true,
      }
    );
  }

  /**
   * Updates the status of a transaction by its unique identifier.
   *
   * @param transactionId - The unique identifier of the transaction.
   * @param transactionStatus - The new status of the transaction.
   */
  async updateTransactionStatus(
    transactionId: string | ObjectId,
    transactionStatus: ITransaction['status']
  ) {
    return await TransactionSchema.findByIdAndUpdate(
      transactionId,
      { status: transactionStatus },
      { new: true }
    ).lean();
  }

  /**
   * Deletes a transaction by its unique identifier.
   *
   * @param transactionId - The unique identifier of the transaction.
   */
  async deleteTransaction(transactionId: string | ObjectId) {
    await TransactionSchema.findByIdAndDelete(transactionId).lean();
  }

  /**
   * Filters transactions by type (CREDIT or DEBIT) for a specific user.
   *
   * @param userId - The unique identifier of the user.
   * @param type - The type of transactions to filter (CREDIT or DEBIT).
   * @returns A promise that resolves to an array of {@link ITransaction} objects.
   */
  async filterTransactionsByType(
    userId: string | ObjectId,
    type: ITransaction['type']
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({ userId, type }).lean();
  }

  /**
   * Filters transactions by status (PENDING, SUCCESS, or FAILED) for a specific user.
   *
   * @param userId - The unique identifier of the user.
   * @param status - The status of transactions to filter.
   * @returns A promise that resolves to an array of {@link ITransaction} objects.
   */
  async filterTransactionsByStatus(
    userId: string | ObjectId,
    status: ITransaction['status']
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({ userId, status }).lean();
  }

  /**
   * Filters transactions by a date range for a specific user.
   *
   * @param userId - The unique identifier of the user.
   * @param startDate - The start of the date range.
   * @param endDate - The end of the date range.
   * @returns A promise that resolves to an array of {@link ITransaction} objects.
   */
  async filterTransactionsByDate(
    userId: string | ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();
  }

  /**
   * Retrieves all successful transactions for a specific user.
   *
   * @param userId - The unique identifier of the user.
   * @returns A promise that resolves to an array of successful {@link ITransaction} objects.
   */
  async getSuccessfulTransactions(
    userId: string | ObjectId
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({
      userId,
      status: 'SUCCESS',
    }).lean();
  }

  /**
   * Retrieves all transactions with a specific type (CREDIT or DEBIT) and status (PENDING, SUCCESS, or FAILED).
   *
   * @param userId - The unique identifier of the user.
   * @param type - The type of transactions (CREDIT or DEBIT).
   * @param status - The status of the transactions (PENDING, SUCCESS, or FAILED).
   * @returns A promise that resolves to an array of {@link ITransaction} objects.
   */
  async filterTransactionsByTypeAndStatus(
    userId: string | ObjectId,
    type: ITransaction['type'],
    status: ITransaction['status']
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({ userId, type, status }).lean();
  }

  /**
   * Retrieves transactions in descending order of date.
   *
   * @param userId - The unique identifier of the user.
   * @param limit - The maximum number of transactions to return.
   * @returns A promise that resolves to an array of {@link ITransaction} objects.
   */
  async getRecentTransactions(
    userId: string | ObjectId,
    limit: number
  ): Promise<ITransaction[]> {
    return await TransactionSchema.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
  }
}
