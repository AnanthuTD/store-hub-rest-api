import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import morgan from 'morgan';
import passport from 'passport';
// import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import extractJwtFromCookie from './interfaces/middleware/extractJwtFromCookie';
import './infrastructure/auth/user/LocalStrategy';
import './infrastructure/auth/user/GoogleStrategy';
import './infrastructure/auth/user/JwtStrategy';
import './infrastructure/auth/vendor/JwtShopOwner';
import './infrastructure/auth/admin/JwtStrategy';
import './infrastructure/auth/partner/JwtStrategy';
import './infrastructure/auth/vendor/GoogleStrategy';
import router from './interfaces/routes';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import env from './infrastructure/env/env';

const app = express();

// Middleware for parsing cookies
app.use(cookieParser());

// Middleware for securing HTTP headers
// app.use(helmet());

// Rate limiting middleware
/* const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
}); */
// app.use(limiter);

// Middleware for compressing response bodies
app.use(compression());

// Body parsing middleware with payload size limits
app.use(express.json()); // Limiting payload size to 10kb for security
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'https://store-hub-pwa.vercel.app',
  'https://www.ananthutd.live',
  'https://storehub.ananthutd.live',
];

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (env.isDevelopment) {
      // Allow all origins in non-production environments
      return callback(null, true);
    }

    // Production CORS restrictions
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false); // Reject the request
    }

    // Allow the request if origin is in the allowedOrigins array
    callback(null, true);
  },
  credentials: true, // Allows cookies and credentials in cross-origin requests
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(cors(corsOptions));

// HTTP request logger middleware
app.use(morgan('dev'));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Custom middleware to extract JWT from cookies
app.use(extractJwtFromCookie);

// Initialize passport for authentication
app.use(passport.initialize());

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
app.use('/api', router);

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
