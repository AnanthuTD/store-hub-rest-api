import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import logger from "./utils/logger";
import morgan from "morgan";

// Initialize Express app
const app = express();

// Middleware for securing HTTP headers
app.use(helmet());

// Middleware for compressing response bodies to improve performance
app.use(compression());

// Middleware to handle JSON and URL-encoded payloads with size limits
app.use(express.json({ limit: "10kb" })); // TODO: Is it ok to limit payload size?
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Middleware for handling Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Morgan middleware for logging HTTP requests
app.use(morgan("dev"));

// Serve static files from the 'public' directory under the '/static' route
app.use("/static", express.static(path.join(__dirname, "public")));

// Error handling middleware to catch and respond to any errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500).send("Something broke!");
});

export default app;
