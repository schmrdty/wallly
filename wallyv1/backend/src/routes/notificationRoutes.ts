import { Router } from 'express';
import {
  handleFarcasterWebhook,
  handleFarcasterNotification,
  handleTelegramWebhook,
  handleDiscordWebhook,
  handleTelegramBotServiceWebhook,
  handleRedisWebhook,
  getUserAuditLog
} from '../controllers/notificationController.js';

const router = Router();

router.post('/farcaster-webhook', handleFarcasterWebhook);
/**
 * @swagger
 * /api/notification/farcaster-webhook:
 *   post:
 *     summary: Handle Farcaster webhook notifications
 *     description: Receives and processes notifications from Farcaster.
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: The type of event being notified.
 *               data:
 *                 type: object
 *                 description: The data associated with the event.
 *     responses:
 *       200:
 *         description: Successfully processed the notification.
 */
router.post('/farcaster-notification', handleFarcasterNotification);
/**
 * @swagger
 * /api/notification/farcaster-notification:
 *   post:
 *     summary: Handle Farcaster notification requests
 *     description: Receives and processes notifications from Farcaster.
 *     tags: [Notification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokens:
 *                 type: array
 *                 items:
 *                   type: string
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               targetUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully processed the notification.
 */
router.post('/telegramWebhook', handleTelegramWebhook);
router.post('/discordWebhook', handleDiscordWebhook);
router.post('/TelegramBotServiceWebhook', handleTelegramBotServiceWebhook);
router.post('/RedisWebhook', handleRedisWebhook);
router.get('/audit/:userId', getUserAuditLog);

export default router;
