import { Request, Response, NextFunction } from 'express';
import logger from '../infra/mon/logger.js';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ error: 'No authorization header' });
            return;
        }

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
