import { Request, Response } from 'express';
import { walletService } from '../services/walletService.js';
import logger from '../infra/mon/logger.js';

export const getWalletInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const wallet = await walletService.getWalletInfo(id);

        if (!wallet) {
            res.status(404).json({ error: 'Wallet not found' });
            return;
        }

        res.json(wallet);
    } catch (error) {
        logger.error('Error getting wallet info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const walletData = req.body;
        const wallet = await walletService.createWallet(walletData);
        res.status(201).json(wallet);
    } catch (error) {
        logger.error('Error creating wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const wallet = await walletService.updateWallet(id, updates);

        if (!wallet) {
            res.status(404).json({ error: 'Wallet not found' });
            return;
        }

        res.json(wallet);
    } catch (error) {
        logger.error('Error updating wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteWallet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const success = await walletService.deleteWallet(id);

        if (!success) {
            res.status(404).json({ error: 'Wallet not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
