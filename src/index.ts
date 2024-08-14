import app from './app';
import connectDB from './infrastructure/database/db';
import env from './infrastructure/env/env';
import logger from './infrastructure/utils/Logger';

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
