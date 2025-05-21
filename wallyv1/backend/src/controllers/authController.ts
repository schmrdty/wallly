import { Request, Response } from 'express';
import { farcasterService } from '../services/farcasterService';
import { WallyService } from '../services/wallyService';
import { sessionService } from '../services/sessionService';
import { logError } from '../infra/mon/logger';

const wallyService = new WallyService();

export const login = async (req: Request, res: Response) => {
    try {
        // Accept either userAddress or fid, but prefer fid if using Farcaster
        const { signature, userAddress, domain, nonce, message } = req.body;
        const { success, fid, error } = await farcasterService.validateSignature({
            domain,
            nonce,
            message,
            signature,
        });

        if (!success) {
            logError('Farcaster signature verification failed', error);
            return res.status(401).json({ message: 'Invalid signature' });
        }

        // Optionally: Sync on-chain permissions using fid or userAddress
        await wallyService.syncUserPermissions(userAddress || fid);

        // Optionally: Store fid in session or user record
        const session = await sessionService.createSession(userAddress || fid, true);

        res.status(200).json({ session, fid });
    } catch (error) {
        logError('Error during creating session', error);
        res.status(500).json({ message: 'Internal server error', error: (error as Error).message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { userAddress, fid } = req.body;
        await sessionService.revokeSession(userAddress || fid, 'user');
        await wallyService.revokeUserPermissions(userAddress || fid);
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