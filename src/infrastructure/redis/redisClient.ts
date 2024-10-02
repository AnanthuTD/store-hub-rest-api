import Redis from 'ioredis';
import env from '../env/env';
import logger from '../utils/logger';

const redisClient = new Redis(env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.status || redisClient.status === 'end') {
    await redisClient.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.status !== 'end') {
    await redisClient.quit();
  }
};

export default redisClient;
