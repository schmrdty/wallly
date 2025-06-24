import { Request, Response, NextFunction } from 'express';
import logger from '../infra/mon/logger.js';
import redisClient from '../db/redisClient.js';

export async function renewPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { permissionId } = req.body;
    const { expirationTime } = req.body;
    if (!permissionId || !expirationTime) {
      res.status(400).json({ error: 'Missing permissionId or expirationTime' });
      return;
    }
    await redisClient.set(`permission:${permissionId}:expiration`, expirationTime);
    res.json({ success: true, permissionId, newExpiration: expirationTime });
  } catch (error) {
    logger.error('Error renewing permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { permissionId } = req.params;

    res.json({ success: true, permissionId, revoked: true });
  } catch (error) {
    logger.error('Error revoking permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function previewPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissionData = req.body;

    res.json({ success: true, preview: permissionData });
  } catch (error) {
    logger.error('Error previewing permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
