import { Request, Response, NextFunction } from 'express';
import logger from '../infra/mon/logger.js';
import { notificationService } from '../services/notificationService.js';

export const handleFarcasterWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    logger.info('Received Farcaster webhook:', webhookData);
    // TODO: Implement Farcaster webhook handling
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Farcaster webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleFarcasterNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notificationData = req.body;
    logger.info('Received Farcaster notification:', notificationData);
    // TODO: Implement Farcaster notification handling
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Farcaster notification:', error);
    next(error);
  }
};

export const handleTelegramWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    logger.info('Received Telegram webhook:', webhookData);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleDiscordWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    logger.info('Received Discord webhook:', webhookData);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Discord webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleTelegramBotServiceWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    logger.info('Received Telegram Bot Service webhook:', webhookData);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Telegram Bot Service webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleRedisWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookData = req.body;
    logger.info('Received Redis webhook:', webhookData);
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error handling Redis webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Get user notifications from notification service
    const notifications = await notificationService.getUserNotifications(userId, limit, offset);

    // Format for frontend compatibility
    const auditEvents = notifications.map(notification => ({
      event: notification.title,
      message: notification.message,
      transactionHash: notification.data?.transactionHash,
      createdAt: new Date(notification.timestamp).toISOString(),
      tokenSymbol: notification.data?.tokenSymbol,
      delegate: notification.data?.delegate,
      tokens: notification.data?.tokens,
      expiresAt: notification.data?.expiresAt,
      revokedAt: notification.data?.revokedAt,
      oracleTimestamp: notification.data?.oracleTimestamp
    }));

    res.status(200).json(auditEvents);
  } catch (error) {
    logger.error('Error getting user audit log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
