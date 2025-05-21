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
import session from 'express-session';
import sessionsRoutes from './routes/sessions';
import { logError, logInfo, logDebug, logWarn } from './infra/mon/logger';
import { Request, Response, NextFunction } from 'express';
import { processScheduledRenewals } from './services/permissionRenewalWorker';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_super_secret_key', // use a strong secret in production!
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// 30 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
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
app.use('/sessions', sessionsRoutes);

// Start contract event listeners
startEventListeners();

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logError(err);

  // Handle contract errors
  if (err.errorName) {
    const errorMap: Record<string, { status: number, message: string }> = {
      NotSettingsAdmin:      { status: 403, message: 'Only settings admin allowed.' },
      NotOwner:              { status: 403, message: 'Only owner allowed.' },
      NotWhitelisted:        { status: 403, message: 'Not whitelisted.' },
      NoActivePermission:    { status: 403, message: 'No active permission.' },
      PermissionExpired:     { status: 403, message: 'Permission expired.' },
      NoWithdrawalAddress:   { status: 400, message: 'No withdrawal address set.' },
      TokenNotWatched:       { status: 400, message: 'Token not watched.' },
      TokenNotInList:        { status: 400, message: 'Token not in list.' },
      NoDelegate:            { status: 400, message: 'No delegate specified.' },
      SessionExpired:        { status: 403, message: 'Session expired.' },
      NotAuthorizedDelegate: { status: 403, message: 'Not authorized delegate.' },
      InvalidNonce:          { status: 400, message: 'Invalid nonce.' },
      InvalidSignature:      { status: 400, message: 'Invalid signature.' },
      ZeroAddress:           { status: 400, message: 'Zero address not allowed.' },
      BadDuration:           { status: 400, message: 'Invalid duration.' },
      BadInput:              { status: 400, message: 'Bad input.' },
      RateLimited:           { status: 429, message: 'Rate limited. Try again later.' },
      NativeTransferFailed:  { status: 500, message: 'Native transfer failed.' },
      ERC20TransferFailed:   { status: 500, message: 'ERC20 transfer failed.' },
      ArrayLengthMismatch:   { status: 400, message: 'Array length mismatch.' },
      FeeTooHigh:            { status: 400, message: 'Fee too high.' },
      InvalidSessionTokens:  { status: 400, message: 'Invalid session tokens.' },
    };
    const mapped = errorMap[err.errorName];
    if (mapped) {
      return res.status(mapped.status).json({ message: mapped.message });
    }
    // Unknown contract error
    return res.status(400).json({ message: err.errorName });
  }

  // Handle HTTP errors
  if (err.status === 401) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (err.status === 400) {
    return res.status(400).json({ message: err.message || 'Bad request' });
  }

  // Fallback
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to Redis and DB, then start server
Promise.all([
    connectRedis(),
    sequelize.authenticate()
])
    .then(() => {
        app.listen(PORT, () => {
            logInfo(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        logError(err);
        process.exit(1);
    });

// Run every minute (60,000 ms)
setInterval(() => {
  processScheduledRenewals().catch(console.error);
}, 60_000);