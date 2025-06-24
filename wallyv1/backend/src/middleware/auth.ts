import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/sessionService.js';
import logger from '../infra/mon/logger.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const sessionId = authHeader.split(' ')[1];
    const session = await sessionService.getSession(sessionId);

    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    // Add session data to request for use in route handlers
    (req as any).session = session;
    (req as any).user = session.user;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
