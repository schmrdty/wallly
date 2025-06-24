import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getWalletInfo,
    createWallet,
    updateWallet,
    deleteWallet
} from '../controllers/walletController.js';

const router = Router();

// Wallet balance endpoint - must come before /:id route to avoid conflicts
router.get('/balance', async (req: Request, res: Response): Promise<void> => {
    try {
        const { address } = req.query;

        if (!address) {
            res.status(400).json({ error: 'Address parameter is required' });
            return;
        }

        // For now, return mock balance - this can be enhanced later with actual balance fetching
        // In a production app, this would query the blockchain for native token balance
        res.json({
            address,
            balance: '0',
            formatted: '0.0',
            symbol: 'ETH'
        });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
});

// Wallet routes with authentication
router.get('/:id', authenticate, getWalletInfo);
router.post('/', authenticate, createWallet);
router.put('/:id', authenticate, updateWallet);
router.delete('/:id', authenticate, deleteWallet);

// Token balance endpoint for compatibility with frontend
router.get('/:address/tokens', async (req: Request, res: Response): Promise<void> => {
    try {
        const { address } = req.params;

        // For now, return empty array - this can be enhanced later with actual token fetching
        // In a production app, this would query the blockchain for ERC-20 token balances
        res.json([
            // Example token structure for future implementation:
            // {
            //   token: '0x...',
            //   symbol: 'USDC',
            //   balance: '1000000',
            //   decimals: 6
            // }
        ]);
    } catch (error) {
        console.error('Error fetching token balances:', error);
        res.status(500).json({ error: 'Failed to fetch token balances' });
    }
});

export default router;
