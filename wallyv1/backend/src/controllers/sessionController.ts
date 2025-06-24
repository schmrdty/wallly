import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService.js';
import logger from '../infra/mon/logger.js';

export const createSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionType, userData } = req.body;
        const session = await sessionService.createSession(sessionType || 'default', userData);
        res.status(201).json(session);
    } catch (error) {
        logger.error('Error creating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const session = await sessionService.getSession(sessionId);

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        res.json(session);
    } catch (error) {
        logger.error('Error getting session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const extendSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const { ttl } = req.body;
        // Fix: extendSession now accepts optional TTL parameter
        const success = await sessionService.extendSession(sessionId, ttl || 43200); // default 12 hours

        if (!success) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        res.json({ success: true });
    } catch (error) {
        logger.error('Error extending session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const validateSessionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;
        const isValid = await sessionService.validateSession(sessionId);

        res.json({ isValid });
    } catch (error) {
        logger.error('Error validating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
