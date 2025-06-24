import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './infra/mon/logger.js';
import redisClient from './db/redisClient.js';

// Import routes - ADDING BACK ONE BY ONE TO ISOLATE THE ISSUE
import walletRoutes from './routes/walletRoutes.js';
import sessionRoutes from './routes/sessions.js';
import contractSessionRoutes from './routes/contractSessions.js';
import notificationRoutes from './routes/notificationRoutes.js';
import tokenRoutes from './routes/token.js';
import contractIntegrationRoutes from './routes/contractIntegration.js';
import authRouter from './routes/auth.js'; // Changed from authRoutes.js to auth.js
import healthRoutes from './routes/health.js';
import funFeedRoutes from './routes/funfeed.js'; // New import for funfeed
import eventRoutes from './routes/events.js'; // Re-enabled real events route
import permissionRoutes from './routes/permissionRoutes.js'; // Added permission routes

// Import automation routes
import autoSaveRoutes from './routes/autoSave.js';
import subscriptionRoutes from './routes/subscription.js';
import billPaymentRoutes from './routes/billPayment.js';
import charityDonationRoutes from './routes/charityDonation.js';
import emergencyFundRoutes from './routes/emergencyFund.js';
import investmentDCARoutes from './routes/investmentDCA.js';
import multiWalletConsolidationRoutes from './routes/multiWalletConsolidation.js';
import zeroOutRoutes from './routes/zeroOut.js';
import userSettingsRoutes from './routes/userSettings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://wally.schmidtiest.xyz',
    'https://app.schmidtiest.xyz',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/wallets', walletRoutes);
app.use('/api/walletRoutes', walletRoutes); // Added for frontend compatibility
app.use('/api/sessions', sessionRoutes);
app.use('/api/contract-sessions', contractSessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/contract', contractIntegrationRoutes);
app.use('/api/auth', authRouter);
app.use('/api/health', healthRoutes);
app.use('/api/funfeed', funFeedRoutes); // Registering the new funfeed route
app.use('/api/events', eventRoutes); // Re-enabled real events route
app.use('/api/permission', permissionRoutes); // Added permission routes

// Wallet balance route for compatibility
app.use('/api/wallet', walletRoutes);

// Automation routes
app.use('/api/autoSave', autoSaveRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/billPayment', billPaymentRoutes);
app.use('/api/charityDonation', charityDonationRoutes);
app.use('/api/emergencyFund', emergencyFundRoutes);
app.use('/api/investmentDCA', investmentDCARoutes);
app.use('/api/multiWalletConsolidation', multiWalletConsolidationRoutes);
app.use('/api/zeroOut', zeroOutRoutes);
app.use('/api/user', userSettingsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler - DEBUGGING
app.use((req, res) => {
  console.log(`📍 404 Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl, method: req.method });
});

async function startServer() {
  try {
    console.log('Starting backend server...');

    // Connect to Redis - OPTIONAL (continues without Redis if not available)
    try {
      await redisClient.connect();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️ Redis connection failed, continuing without Redis. This is normal in development without local Redis server.');
      console.warn('💡 Redis errors can be ignored - server will function without caching');
    }    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Express server listening on port ${PORT}`);
      console.log(`🌐 CORS Origins: https://wally.schmidtiest.xyz, https://app.schmidtiest.xyz, http://localhost:3000, http://localhost:3001, http://localhost:3002`);
      console.log('⚡ Server started successfully');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  try {
    await redisClient.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.warn('⚠️ Redis disconnect error (normal if Redis wasn\'t connected)');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  try {
    await redisClient.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.warn('⚠️ Redis disconnect error (normal if Redis wasn\'t connected)');
  }
  process.exit(0);
});

startServer();
