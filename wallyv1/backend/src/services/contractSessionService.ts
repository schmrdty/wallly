import { v4 as uuidv4 } from 'uuid';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

export interface ContractSessionData {
  contractSessionId?: string;
  userId: string;
  walletAddress: string;
  delegate: string;
  allowedTokens: string[];
  allowWholeWallet: boolean;
  expiresAt: number | string;
  txHash: string;
  createdAt?: number;
  revoked?: boolean;
  revokedAt?: number;
}

const CONTRACT_SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

class ContractSessionService {
  /**
   * Create a new contract session
   */
  async createContractSession(data: ContractSessionData): Promise<ContractSessionData> {
    try {
      const contractSessionId = uuidv4();
      const now = Date.now();
      const expiresAt = typeof data.expiresAt === 'string' ?
        parseInt(data.expiresAt) : data.expiresAt;

      const sessionData: ContractSessionData = {
        contractSessionId,
        userId: data.userId,
        walletAddress: data.walletAddress,
        delegate: data.delegate,
        allowedTokens: data.allowedTokens,
        allowWholeWallet: data.allowWholeWallet,
        expiresAt,
        txHash: data.txHash,
        createdAt: now,
        revoked: false,
      };

      // Try to store in Redis, gracefully handle failure
      const stored = await redisClient.setEx(
        `contractSession:${contractSessionId}`,
        CONTRACT_SESSION_TTL,
        JSON.stringify(sessionData)
      );

      if (stored) {
        // Index by userId and wallet if Redis is available
        await redisClient.setEx(`userContractSession:${data.userId}`, CONTRACT_SESSION_TTL, contractSessionId);
        await redisClient.setEx(`walletContractSession:${data.walletAddress}`, CONTRACT_SESSION_TTL, contractSessionId);
        logger.info('Contract session stored in Redis', { contractSessionId });
      } else {
        logger.warn('Contract session created but not cached (Redis unavailable)', { contractSessionId });
      }

      return sessionData;
    } catch (err: any) {
      logger.error('Failed to create contract session', err);
      throw new Error(`Failed to create contract session: ${err.message}`);
    }
  }

  /**
   * Get a user's contract session by userId
   */
  async getUserContractSession(userId: string): Promise<ContractSessionData | null> {
    try {
      if (!redisClient.isConnected()) {
        logger.warn('Redis unavailable, cannot fetch user contract session');
        return null;
      }

      const contractSessionId = await redisClient.get(`userContractSession:${userId}`);
      if (!contractSessionId) return null;

      return await this.getContractSession(contractSessionId);
    } catch (err: any) {
      logger.error('Failed to fetch user contract session', err);
      return null;
    }
  }

  /**
   * Get contract session by ID
   */
  async getContractSession(contractSessionId: string): Promise<ContractSessionData | null> {
    try {
      const sessionRaw = await redisClient.get(`contractSession:${contractSessionId}`);

      if (!sessionRaw) {
        return null;
      } const session: ContractSessionData = JSON.parse(sessionRaw);

      // Ensure numeric fields are numbers
      session.expiresAt = Number(session.expiresAt);
      session.createdAt = Number(session.createdAt);
      if (session.revokedAt) {
        session.revokedAt = Number(session.revokedAt);
      }

      // Check if expired
      const now = Date.now();
      if (now > session.expiresAt) {
        await this.revokeContractSession(contractSessionId, 'expired');
        return null;
      }

      return session;
    } catch (err: any) {
      logger.error('Failed to get contract session', err);
      throw new Error(`Failed to get contract session: ${err.message}`);
    }
  }

  /**
   * Get contract session by wallet address
   */
  async getContractSessionByWallet(walletAddress: string): Promise<ContractSessionData | null> {
    try {
      const contractSessionId = await redisClient.get(`walletContractSession:${walletAddress}`);

      if (!contractSessionId) {
        return null;
      }

      return await this.getContractSession(contractSessionId);
    } catch (err: any) {
      logger.error('Failed to fetch wallet contract session', err);
      throw new Error(`Failed to fetch contract session: ${err.message}`);
    }
  }

  /**
   * Revoke a contract session by ID
   */
  async revokeContractSession(contractSessionId: string, reason = 'user_request'): Promise<boolean> {
    try {
      const session = await this.getContractSession(contractSessionId);

      if (!session) {
        logger.warn('Contract session not found for revocation', { contractSessionId });
        return false;
      }

      if (session.revoked) {
        logger.info('Contract session already revoked', { contractSessionId });
        return true;
      }

      // Update session to revoked state
      const revokedSession: ContractSessionData = {
        ...session,
        revoked: true,
        revokedAt: Date.now(),
      };

      // Update in Redis
      await redisClient.setEx(
        `contractSession:${contractSessionId}`,
        CONTRACT_SESSION_TTL,
        JSON.stringify(revokedSession)
      );

      // Remove active indexes
      await redisClient.del(`userContractSession:${session.userId}`);
      await redisClient.del(`walletContractSession:${session.walletAddress}`);

      logger.info('Contract session revoked', {
        contractSessionId,
        reason,
        userId: session.userId
      });

      return true;
    } catch (err: any) {
      logger.error('Failed to revoke contract session', err);
      throw new Error(`Failed to revoke contract session: ${err.message}`);
    }
  }

  /**
   * Validate if a contract session is active
   */
  async validateContractSession(contractSessionId: string): Promise<boolean> {
    try {
      const session = await this.getContractSession(contractSessionId);
      return session !== null && !session.revoked;
    } catch (err: any) {
      logger.error('Failed to validate contract session', err);
      return false;
    }
  }

  /**
   * Get all active contract sessions (admin function)
   */
  async getAllActiveContractSessions(): Promise<ContractSessionData[]> {
    try {
      const keys = await redisClient.keys('contractSession:*');
      const sessions: ContractSessionData[] = [];

      for (const key of keys) {
        const sessionRaw = await redisClient.get(key);
        if (sessionRaw) {
          const session: ContractSessionData = JSON.parse(sessionRaw);
          // Ensure numeric fields are numbers
          session.expiresAt = Number(session.expiresAt);
          if (!session.revoked && Date.now() <= session.expiresAt) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (err: any) {
      logger.error('Failed to get all active contract sessions', err);
      throw new Error(`Failed to get active sessions: ${err.message}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const keys = await redisClient.keys('contractSession:*');
      let cleanedCount = 0;

      for (const key of keys) {
        const sessionRaw = await redisClient.get(key);
        if (sessionRaw) {
          const session: ContractSessionData = JSON.parse(sessionRaw);
          // Ensure numeric fields are numbers
          session.expiresAt = Number(session.expiresAt);
          if (Date.now() > session.expiresAt) {
            await this.revokeContractSession(session.contractSessionId!, 'expired');
            cleanedCount++;
          }
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired contract sessions`);
      return cleanedCount;
    } catch (err: any) {
      logger.error('Failed to cleanup expired sessions', err);
      throw new Error(`Failed to cleanup sessions: ${err.message}`);
    }
  }
}

export const contractSessionService = new ContractSessionService();
