import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import transferRoutes from './routes/transfers';
import sessionRoutes from './routes/sessions';
import walletRoutes from './routes/walletRoutes';
import tokenRoutes from './routes/token';
import { startEventListeners } from './services/eventListenerService';
import { connectRedis } from '../db/redisClient';
import { sequelize } from '../db/index';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://yourfrontenddomain.com', // Replace with your actual frontend domain
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Example: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Apply to all public endpoints (before routes)
app.use('/api/auth', limiter);
app.use('/api/token', limiter);
// Optionally: app.use(limiter); // for all routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/token', tokenRoutes);

// Start contract event listeners
startEventListeners();

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error internally
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to Redis and DB, then start server
Promise.all([
    connectRedis(),
    sequelize.authenticate()
])
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });