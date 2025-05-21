import { Request, Response } from 'express';
import { WalletService } from '../services/walletService';
import { WallyService } from '../services/wallyService';
import { logError } from '../infra/mon/logger';

const walletService = new WalletService();
const wallyService = new WallyService();

export const getWalletInfo = async (req: Request, res: Response) => {
    try {
        const walletId = req.params.id;
        if (!walletId) return res.status(400).json({ message: 'Missing wallet ID' });

        // Fetch wallet info from DB
        const walletInfo = await walletService.getWalletInfo(walletId);
        if (!walletInfo) return res.status(404).json({ message: 'Wallet not found' });

        // Fetch on-chain balances using WallyService
        const onChainBalances = await wallyService.getAllTokenBalances(walletInfo.address);

        res.status(200).json({ ...walletInfo, onChainBalances });
    } catch (error) {
        logError(`Error retrieving wallet info: ${error}`);
        res.status(500).json({ message: 'Error retrieving wallet information' });
    }
};

export const createWallet = async (req: Request, res: Response) => {
    try {
        const { userId, userEmail, type } = req.body;
        let wallet;
        if (type === 'coinbase') {
            wallet = await walletService.createCoinbaseSmartWallet(userId, userEmail);
        } else {
            wallet = await walletService.createWallet({ userId, userEmail });
        }
        res.status(201).json({ wallet });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to create wallet' });
    }
};

export const updateWallet = async (req: Request, res: Response) => {
    try {
        const walletId = req.params.id;
        const walletData = req.body;
        if (!walletId) return res.status(400).json({ message: 'Missing wallet ID' });

        const updatedWallet = await walletService.updateWallet(walletId, walletData);
        if (!updatedWallet) return res.status(404).json({ message: 'Wallet not found' });

        res.status(200).json(updatedWallet);
    } catch (error) {
        logError(`Error updating wallet: ${error}`);
        res.status(500).json({ message: 'Error updating wallet' });
    }
};

export const deleteWallet = async (req: Request, res: Response) => {
    try {
        const walletId = req.params.id;
        if (!walletId) return res.status(400).json({ message: 'Missing wallet ID' });

        const deleted = await walletService.deleteWallet(walletId);
        if (!deleted) return res.status(404).json({ message: 'Wallet not found' });

        res.status(204).send();
    } catch (error) {
        logError(`Error deleting wallet: ${error}`);
        res.status(500).json({ message: 'Error deleting wallet' });
    }
};