import winston from "winston";
import env from "../configs/env";

const logLevel = env.isProduction ? "info" : "debug";

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "user-service" },
  transports: [
    // Log all errors to error.log
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),

    // Log all info and lower-level logs to combined.log
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// If not in production, add console logging with simple format
if (!env.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
