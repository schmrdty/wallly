import express from 'express';
import { createWallet, getWalletInfo, updateWallet, deleteWallet } from '../controllers/walletController';
import { authenticate } from '../middleware/authenticate';

const router = express.Router();

// Health check route (no auth)
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// All routes below require authentication
router.use(authenticate);

// Wallet routes
router.get('/:id', getWalletInfo);
router.post('/', createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);

// Test route (optional)
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Wallet routes are working!' });
});

export default router;
