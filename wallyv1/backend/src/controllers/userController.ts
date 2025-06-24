import { Request, Response } from 'express';
import logger from '../infra/mon/logger.js';
import redisClient from '../db/redisClient.js';

export const setUserPrefs = async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = req.body;
    res.json({ success: true, preferences });
  } catch (error) {
    logger.error('Error setting user preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setAutorenew = async (req: Request, res: Response): Promise<void> => {
  try {
    const { autorenew } = req.body;
    res.json({ success: true, autorenew });
  } catch (error) {
    logger.error('Error setting autorenew:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const data = await redisClient.get(`user:settings:${userId}`);
    res.json(data ? JSON.parse(data) : {});
  } catch (error) {
    logger.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const updates = req.body;
    await redisClient.set(`user:settings:${userId}`, JSON.stringify(updates));
    res.json({ success: true, userId, updates });
  } catch (error) {
    logger.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
