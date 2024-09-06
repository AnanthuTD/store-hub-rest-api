import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import morgan from 'morgan';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import extractJwtFromCookie from './interfaces/middleware/extractJwtFromCookie';
import './infrastructure/auth/user/LocalStrategy';
import './infrastructure/auth/user/GoogleStrategy';
import './infrastructure/auth/user/JwtStrategy';
import './infrastructure/auth/shopOwner/JwtShopOwner';
import './infrastructure/auth/admin/JwtStrategy';
import './infrastructure/auth/shopOwner/GoogleStrategy';
import router from './interfaces/routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const app = express();

// Middleware for parsing cookies
app.use(cookieParser());

// Middleware for securing HTTP headers
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware for compressing response bodies
app.use(compression());

// Body parsing middleware with payload size limits
app.use(express.json()); // Limiting payload size to 10kb for security
app.use(express.urlencoded({ extended: true }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// HTTP request logger middleware
app.use(morgan('dev'));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Initialize passport for authentication
app.use(passport.initialize());

// Custom middleware to extract JWT from cookies
app.use(extractJwtFromCookie);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShopHub API Documentation',
      version: '1.0.0',
      description: 'API documentation for ShopHub',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local server',
      },
    ],
  },
  apis: ['src/interfaces/routes/**/*.ts'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API endpoint
app.use('/', router);

// Catch-all route for handling unknown endpoints
app.use((req, res) => {
  res.status(404).send({ message: 'API not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
router.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

export default app;
