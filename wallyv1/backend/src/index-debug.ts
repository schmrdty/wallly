import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './infra/mon/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'https://wally.schmidtiest.xyz',
        'https://app.schmidtiest.xyz',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('Server starting with health check only...');

// Test each route import one by one
try {
    console.log('Testing route imports...');

    // Test 1: Health routes
    console.log('1. Importing health routes...');
    const healthRoutes = await import('./routes/health.js');
    app.use('/api/health', healthRoutes.default);
    console.log('✓ Health routes imported successfully');

    // Test 2: Auth routes
    console.log('2. Importing auth routes...');
    const authRoutes = await import('./routes/auth.js');
    app.use('/api/auth', authRoutes.default);
    console.log('✓ Auth routes imported successfully');

    // Test 3: Wallet routes
    console.log('3. Importing wallet routes...');
    const walletRoutes = await import('./routes/walletRoutes.js');
    app.use('/api/wallets', walletRoutes.default);
    console.log('✓ Wallet routes imported successfully');

    // Test 4: Session routes
    console.log('4. Importing session routes...');
    const sessionRoutes = await import('./routes/sessions.js');
    app.use('/api/sessions', sessionRoutes.default);
    console.log('✓ Session routes imported successfully');

    // Test 5: Contract session routes
    console.log('5. Importing contract session routes...');
    const contractSessionRoutes = await import('./routes/contractSessions.js');
    app.use('/api/contract-sessions', contractSessionRoutes.default);
    console.log('✓ Contract session routes imported successfully');

    // Test 6: Token routes
    console.log('6. Importing token routes...');
    const tokenRoutes = await import('./routes/token.js');
    app.use('/api/token', tokenRoutes.default);
    console.log('✓ Token routes imported successfully');

    // Test 7: Notification routes
    console.log('7. Importing notification routes...');
    const notificationRoutes = await import('./routes/notificationRoutes.js');
    app.use('/api/notifications', notificationRoutes.default);
    console.log('✓ Notification routes imported successfully');

    // Test 8: Contract integration routes
    console.log('8. Importing contract integration routes...');
    const contractIntegrationRoutes = await import('./routes/contractIntegration.js');
    app.use('/api/contract', contractIntegrationRoutes.default);
    console.log('✓ Contract integration routes imported successfully');

    console.log('All routes imported successfully!');

} catch (error) {
    console.error('Error importing routes:', error);
    process.exit(1);
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
