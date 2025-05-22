import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logError } from '../infra/mon/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logError('Unauthorized: No token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded; // Attach user info to request
    next();
  } catch (err) {
    logError('Unauthorized: Invalid token');
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}
