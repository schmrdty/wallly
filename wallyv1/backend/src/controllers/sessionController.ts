import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { logError } from '../infra/mon/logger';

export const createSession = async (req: Request, res: Response) => {
    try {
        const { userAddress, allowEntireWallet, allowedTokens } = req.body;
        const session = await sessionService.createSession(userAddress, allowEntireWallet, allowedTokens);

        // Set sessionId as HTTP-only cookie
        res.cookie('sessionId', session.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.status(201).json({ session }); // Optionally, do not include sessionId in the JSON
    } catch (error) {
        logError(`Error creating session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const validateSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const isValid = await sessionService.validateSession(sessionId as string);
        res.status(200).json({ isValid });
    } catch (error) {
        logError(`Error validating session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const session = await sessionService.getSession(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.status(200).json({ session });
    } catch (error) {
        logError(`Error retrieving session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const getAllSessions = async (req: Request, res: Response) => {
    try {
        const sessions = await sessionService.getAllSessions();
        res.status(200).json({ sessions });
    } catch (error) {
        logError(`Error retrieving all sessions: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const updateSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { allowEntireWallet, allowedTokens } = req.body;
        const updatedSession = await sessionService.updateSession(sessionId, allowEntireWallet, allowedTokens);
        if (!updatedSession) return res.status(404).json({ message: 'Session not found' });
        res.status(200).json({ updatedSession });
    } catch (error) {
        logError(`Error updating session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const deleteSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        await sessionService.deleteSession(sessionId);
        res.status(204).send();
    } catch (error) {
        logError(`Error deleting session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const revokeSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        await sessionService.revokeSession(sessionId, 'user');
        res.status(204).send();
    } catch (error) {
        logError(`Error revoking session: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};