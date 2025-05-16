import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';

export const createSession = async (req: Request, res: Response) => {
    try {
        const { userAddress, allowEntireWallet, allowedTokens } = req.body;
        const session = await sessionService.createSession(userAddress, allowEntireWallet, allowedTokens);
        res.status(201).json({ session });
    } catch (error) {
        logError(`Error creating session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });    }
};

export const validateSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.query;
        const isValid = await sessionService.validateSession(sessionId as string);
        res.status(200).json({ isValid });
    } catch (error) {
        logError(`Error validating session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });    }
};

export const revokeSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;
        await sessionService.revokeSession(sessionId, 'user');
        res.status(204).send();
    } catch (error) {
        logError(`Error revoking session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });    }
};