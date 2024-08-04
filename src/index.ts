import app from './app';
import env from './configs/env';
import logger from './utils/logger';

// Start the server
app.listen(env.PORT, () => {
    logger.info(`Server is running on http://localhost:${env.PORT}`);
});
