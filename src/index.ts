import app from './app';
import connectDB from './configs/db';
import env from './configs/env';
import logger from './utils/logger';

const start = async () => {
  try {
    connectDB();
  } catch (err) {
    console.error(err);
  }

  app.listen(env.PORT, () => {
    logger.info(`Server is running on http://localhost:${env.PORT}`);
  });
};

start();
