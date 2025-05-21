import { Request, Response } from 'express';
import redisClient from '../../db/redisClient';
import { Permission } from '../../db/models';
import { WallyService } from '../services/wallyService';

const wallyService = new WallyService();

/**
 * Renew a user's permission by scheduling a contract call at expiration.
 * - Only allowed if user has opted in for autorenew (default is off).
 * - Only allowed if permission is active and not revoked or scheduled for cleanup.
 * - Only allowed within a renewal window (e.g., 7 days before expiry).
 * - Enforces a cooldown to prevent spam.
 * - Minimum grant time is 1 day.
 * - All privacy-related options default to off/null/false.
 */
export const renewPermission = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId.' });

    // Check if permission is scheduled for cleanup or already revoked
    const cleanupKey = `scheduledCleanup:${userId}`;
    const scheduledCleanup = await redisClient.get(cleanupKey);
    if (scheduledCleanup) {
      return res.status(403).json({ error: 'Permission is scheduled for cleanup or already revoked.' });
    }

    // Enforce cooldown to prevent spam
    const cooldownKey = `renewCooldown:${userId}`;
    const cooldown = await redisClient.get(cooldownKey);
    if (cooldown) {
      return res.status(429).json({ error: 'Please wait before renewing again.' });
    }

    // Fetch user's current permission and arguments
    const permission = await Permission.findOne({ where: { userId, isActive: true } });
    if (!permission) return res.status(404).json({ error: 'No active permission found.' });

    // Only allow renewal if within window (e.g., 7 days before expiry)
    const now = Date.now();
    const expiresAt = new Date(permission.expiresAt).getTime();
    const renewalWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    if (expiresAt - now > renewalWindow) {
      return res.status(400).json({ error: 'Too early to renew.' });
    }

    // Only allow if user has opted in for autorenew (default is off)
    const autorenew = await redisClient.get(`autorenewEnabled:${userId}`);
    if (autorenew !== 'true') {
      return res.status(403).json({ error: 'Autorenew is not enabled for this user.' });
    }

    // Minimum grant time is 1 day
    const minGrantMs = 24 * 60 * 60 * 1000;
    const newExpiresAt = new Date(Math.max(expiresAt + minGrantMs, now + minGrantMs));

    // Schedule contract call at expiration
    const renewAt = expiresAt;
    await redisClient.set(`scheduledRenew:${userId}`, JSON.stringify({
      renewAt,
      args: {
        withdrawalAddress: permission.withdrawalAddress,
        allowEntireWallet: !!permission.allowEntireWallet,
        expiresAt: newExpiresAt.toISOString(),
        tokenList: permission.tokenList || [],
        minBalances: permission.minBalances || [],
        limits: permission.limits || []
      }
    }));

    // Set cooldown (e.g., 1 hour)
    await redisClient.set(cooldownKey, '1', { EX: 3600 });

    res.json({
      success: true,
      scheduledFor: new Date(renewAt).toISOString(),
      newExpiresAt: newExpiresAt.toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Revoke a user's permission.
 * - Cancels any scheduled autorenew or cleanup.
 * - Marks permission as inactive.
 * - All privacy-related options default to off/null/false.
 */
export const revokePermission = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId.' });

    // Cancel any scheduled autorenew or cleanup
    await redisClient.del(`scheduledRenew:${userId}`);
    await redisClient.del(`autorenewEnabled:${userId}`);
    await redisClient.set(`scheduledCleanup:${userId}`, Date.now() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000); // 23:59:59 from now

    // Mark permission as inactive
    await Permission.update({ isActive: false }, { where: { userId, isActive: true } });

    res.json({ success: true, message: 'Permission revoked and cleanup scheduled.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Preview the contract arguments for a permission grant/renewal.
 * Returns the arguments that would be used, so the frontend can show a preview.
 */
export const previewPermission = async (req: Request, res: Response) => {
  try {
    const {
      withdrawalAddress = '',
      allowEntireWallet = false,
      expiresAt,
      tokenList = [],
      minBalances = [],
      limits = []
    } = req.body;

    // Minimum grant time is 1 day
    const minGrantMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiresAtDate = expiresAt
      ? new Date(expiresAt)
      : new Date(now + minGrantMs);

    res.json({
      withdrawalAddress,
      allowEntireWallet: !!allowEntireWallet,
      expiresAt: expiresAtDate.toISOString(),
      tokenList,
      minBalances,
      limits
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Grant a Mini-App session (delegate automation to the Mini-App).
 */
export const grantMiniAppSession = async (req: Request, res: Response) => {
  try {
    const { userId, delegate, tokenList, expiresAt } = req.body;
    if (!userId || !delegate || !expiresAt) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    await wallyService.grantMiniAppSession(userId, delegate, tokenList, expiresAt);
    res.json({ success: true, message: 'Mini-App session granted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Revoke a Mini-App session.
 */
export const revokeMiniAppSession = async (req: Request, res: Response) => {
  try {
    const { userId, delegate } = req.body;
    if (!userId || !delegate) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    await wallyService.revokeMiniAppSession(userId, delegate);
    res.json({ success: true, message: 'Mini-App session revoked.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Mini-App triggers automated forwarding for a user.
 */
export const miniAppTriggerTransfers = async (req: Request, res: Response) => {
  try {
    const { userId, delegate } = req.body;
    if (!userId || !delegate) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    await wallyService.miniAppTriggerTransfers(userId, delegate);
    res.json({ success: true, message: 'Automated forwarding triggered.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};

/**
 * Preview Mini-App session arguments.
 */
export const previewMiniAppSession = async (req: Request, res: Response) => {
  try {
    const {
      delegate = '',
      tokenList = [],
      expiresAt
    } = req.body;

    const minGrantMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const expiresAtDate = expiresAt
      ? new Date(expiresAt)
      : new Date(now + minGrantMs);

    res.json({
      delegate,
      tokenList,
      expiresAt: expiresAtDate.toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
};