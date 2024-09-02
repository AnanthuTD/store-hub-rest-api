// import path from 'node:path';
import app from './app';
import connectDB from './infrastructure/database/db';
import env from './infrastructure/env/env';
import logger from './infrastructure/utils/logger';
// import fs from 'node:fs';
// import https from 'node:https';

/* const sslOptions = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
}; */

const start = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Create an HTTPS server
    // const httpsServer = https.createServer(sslOptions, app);

    // // Start the HTTPS server on port 443
    // httpsServer.listen(443, () => {
    //   logger.info('HTTPS Server running on port 443');
    // });

    // Optionally, start an HTTP server for redirecting to HTTPS or supporting both HTTP and HTTPS
    app.listen(env.PORT, () => {
      logger.info(`HTTP Server running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error(`Error starting the server: ${(err as Error).message}`);
  }
};

start();
