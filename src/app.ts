import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import morgan from 'morgan';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './interfaces/routes/AuthRoutes';
import adminRoutes from './interfaces/routes/AdminRoutes';
import shopOwnerRoutes from './interfaces/routes/ShopOwnerRoutes';
import deliveryPartnerRoutes from './interfaces/routes/DeliveryPartnerRoutes';
import extractJwtFromCookie from './interfaces/middleware/extractJwtFromCookie';

import './infrastructure/auth/LocalStrategy';
import './infrastructure/auth/GoogleStrategy';
import './infrastructure/auth/JwtStrategy';
import './infrastructure/auth/JwtShopOwner';

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

// Authentication routes
app.use('/auth', authRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// ShopOwner routes
app.use('/shopOwner', shopOwnerRoutes);
app.use('/partner', deliveryPartnerRoutes);

// Catch-all route for handling unknown endpoints
app.use((req, res) => {
  res.status(404).send({ message: 'Page not found' });
});

export default app;
