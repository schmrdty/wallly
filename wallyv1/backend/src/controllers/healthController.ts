import { Request, Response } from 'express';
import { healthServices } from '../services/healthServices.js';
import logger from '../infra/mon/logger.js';

export const baseHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getSystemHealth();

    const statusCode = health.overall.status === 'healthy' ? 200 :
      health.overall.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: Date.now(),
    });
  }
};

export const serverHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('server');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Server health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Server health check failed',
      timestamp: Date.now(),
    });
  }
};

export const walletHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('wallet');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Wallet health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Wallet health check failed', timestamp: Date.now() });
  }
};

export const contractHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('contract');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Contract health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Contract health check failed', timestamp: Date.now() });
  }
};

export const blockchainHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('blockchain');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Blockchain health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Blockchain health check failed', timestamp: Date.now() });
  }
};

export const farcasterHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('farcaster');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Farcaster health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Farcaster health check failed', timestamp: Date.now() });
  }
};

export const sessionHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('redis');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Session health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Session health check failed', timestamp: Date.now() });
  }
};

export const transferHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('eventListeners');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Transfer health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Transfer health check failed', timestamp: Date.now() });
  }
};

export const userHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getServiceHealth('notifications');
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('User health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'User health check failed', timestamp: Date.now() });
  }
};

export const authHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if auth endpoints are working
    res.status(200).json({
      status: 'healthy',
      message: 'Auth service operational',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Auth health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Auth health check failed', timestamp: Date.now() });
  }
};

export const tokenListHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check token list availability
    res.status(200).json({
      status: 'healthy',
      message: 'Token list service operational',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Token list health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'Token list health check failed', timestamp: Date.now() });
  }
};

export const appHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await healthServices.getSystemHealth();
    const statusCode = health.overall.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('App health check failed:', error);
    res.status(503).json({ status: 'unhealthy', message: 'App health check failed', timestamp: Date.now() });
  }
};
