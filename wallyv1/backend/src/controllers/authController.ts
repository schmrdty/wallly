import { Request, Response } from 'express';
import { farcasterService } from '../services/farcasterService';
import { wallyService } from '../services/wallyService';
import { sessionService } from '../services/sessionService';

export const login = async (req: Request, res: Response) => {
    try {
        const { signature, userAddress } = req.body;
        const isValid = await farcasterService.validateSignature(userAddress, signature);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        const session = await sessionService.createSession(userAddress, true);
        res.status(200).json({ session });
    } catch (error) {
        logError('Error during creating session', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.body;
        await sessionService.revokeSession(userAddress, 'user');
        res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        logError('Error during Logout', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const validateSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        const isValid = await sessionService.validateSession(sessionId);

        if (!isValid) {
            return res.status(401).json({ message: 'Session is invalid or expired' });
        }

        res.status(200).json({ message: 'Session is valid' });
    } catch (error) {
        logError('Error during session validation', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};