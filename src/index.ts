// import path from 'node:path';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './infrastructure/database/db';
import env from './infrastructure/env/env';
import logger from './infrastructure/utils/logger';
import { createServer } from 'node:http';

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for your front-end origin
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Vendor connected with socket ID:', socket.id);

  // Handle vendor joining specific room or vendor group
  socket.on('joinStoreRoom', (storeId) => {
    socket.join(`store_${storeId}`); // Join room specific to the vendor
  });

  socket.on('disconnect', () => {
    console.log('Vendor disconnected');
  });
});

const start = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Optionally, start an HTTP server for redirecting to HTTPS or supporting both HTTP and HTTPS
    server.listen(env.PORT, () => {
      logger.info(`HTTP Server running at http://localhost:${env.PORT}`);
    });
  } catch (err) {
    logger.error(`Error starting the server: ${(err as Error).message}`);
  }
};

start();
