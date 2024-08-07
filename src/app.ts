import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import authRoutes from './interfaces/routes/AuthRoutes';
import './infrastructure/auth/LocalStrategy';
import './infrastructure/auth/GoogleStrategy';
import './infrastructure/auth/JwtStrategy';
import env from './infrastructure/env/env';

const app = express();

// Middleware for securing HTTP headers
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(compression());

app.use(express.json({ limit: '10kb' })); // TODO: Is it ok to limit payload size?
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(
  session({
    secret: env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(cors());

app.use(morgan('dev'));

app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

export default app;
