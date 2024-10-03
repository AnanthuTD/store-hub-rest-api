import { server } from './socket';
import connectDB from './infrastructure/database/db';
import env from './infrastructure/env/env';
import logger from './infrastructure/utils/logger';
import { connectRedis } from './infrastructure/redis/redisClient';

const start = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Start the server
    server.listen(env.PORT, () => {
      logger.info(`Server running at http://localhost:${env.PORT}`);
    });
  } catch (err) {
    logger.error(`Error starting the server: ${(err as Error).message}`);
  }
};

// Start the server with Socket.IO attached
start();
