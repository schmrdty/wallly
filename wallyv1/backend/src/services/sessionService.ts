import { v4 as uuidv4 } from 'uuid';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

export type RevokeReason = 'user_request' | 'admin_action' | 'expired' | 'security_violation';

export interface SessionUser {
  id: string;
  address?: string;
  authProvider: 'farcaster' | 'ethereum';
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

export interface Session {
  sessionId: string;
  userAddress: string;
  user?: SessionUser;
  createdAt: number;
  expiresAt: number;
  isValid: boolean;
}

class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
  /**
   * Create a new session
   */
  async createSession(authProvider: string, userData: SessionUser): Promise<Session> {
    try {
      const sessionId = uuidv4();
      const now = Date.now();
      const expiresAt = now + (this.SESSION_TTL * 1000);

      const session: Session = {
        sessionId,
        userAddress: userData.address || userData.id,
        user: userData,
        createdAt: now,
        expiresAt,
        isValid: true
      };

      // Try to store session in Redis, with graceful fallback
      try {
        await redisClient.setEx(
          `${this.SESSION_PREFIX}${sessionId}`,
          this.SESSION_TTL,
          JSON.stringify(session)
        );
        logger.info('Session created and stored in Redis', {
          sessionId,
          authProvider,
          userId: userData.id
        });
      } catch (redisError) {
        // Redis failure should not prevent session creation
        // In production, you might want to use a different persistent store
        logger.warn('Session created but not cached (Redis unavailable)', {
          sessionId,
          authProvider,
          userId: userData.id,
          redisError: redisError instanceof Error ? redisError.message : 'Unknown Redis error'
        });
      }

      return session;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }
  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionData = await redisClient.get(`${this.SESSION_PREFIX}${sessionId}`);

      if (!sessionData) {
        return null;
      }

      const session: Session = JSON.parse(sessionData);

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.revokeSession(sessionId, 'expired');
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session (Redis unavailable):', error);
      // In production, you might want to check alternative storage
      return null;
    }
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      return session !== null && session.isValid;
    } catch (error) {
      logger.error('Failed to validate session:', error);
      // Fail securely - if we can't validate, assume invalid
      return false;
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string, reason: RevokeReason): Promise<boolean> {
    try {
      const result = await redisClient.del(`${this.SESSION_PREFIX}${sessionId}`);

      logger.info('Session revoked', { sessionId, reason });

      return result > 0;
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      return false;
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, customTtl?: number): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return false;
      }

      // Use custom TTL if provided, otherwise use default
      const ttlToUse = customTtl || this.SESSION_TTL;

      // Extend expiration
      session.expiresAt = Date.now() + (ttlToUse * 1000);

      await redisClient.setEx(
        `${this.SESSION_PREFIX}${sessionId}`,
        ttlToUse,
        JSON.stringify(session)
      );

      return true;
    } catch (error) {
      logger.error('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const keys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
      const sessions: Session[] = [];

      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session: Session = JSON.parse(sessionData);
          if (session.user?.id === userId) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      return [];
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;
