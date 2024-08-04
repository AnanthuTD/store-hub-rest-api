import mongoose, { MongooseError } from 'mongoose';
import env from './env';
import logger from '../utils/logger';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (err instanceof MongooseError) logger.error(err.message);
    else logger.error(err);
    process.exit(1);
  }
};

export default connectDB;
