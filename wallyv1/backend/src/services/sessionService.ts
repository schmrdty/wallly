import { v4 as uuidv4 } from 'uuid';
import redisClient from '../db/redisClient';

export interface SessionData {
    sessionId: string;
    userAddress: string;
    createdAt: number;
    expiresAt: number;
    allowEntireWallet: boolean; // From ABI, not "allowWholeWallet"
    allowedTokens?: string[];
    revoked?: boolean;
    dateOfFirstGrant?: number;
    dateOfRevoke?: number;
    methodForRevokedInfoSentToUser?: 'telegram' | 'warpcast' | 'email' | null;
    // ... add basic metadata as needed
}

// TTL in seconds (e.g., 12 hours)
const SESSION_TTL = 60 * 24;

export const sessionService = {
    async createSession(userAddress: string, allowEntireWallet: boolean, allowedTokens?: string[]): Promise<SessionData> {
        const sessionId = uuidv4();
        const now = Date.now();
        const expiresAt = now + SESSION_TTL * 1000;
        const sessionData: SessionData = {
            sessionId,
            userAddress,
            createdAt: now,
            expiresAt,
            allowEntireWallet,
            allowedTokens,
            dateOfFirstGrant: now,
            revoked: false,
            methodForRevokedInfoSentToUser: null,
        };
        await redisClient.set(`session:${sessionId}`, JSON.stringify(sessionData), { EX: SESSION_TTL });
        // Optionally index by userAddress as well for fast lookup
        await redisClient.set(`userSession:${userAddress}`, sessionId, { EX: SESSION_TTL });
        return sessionData;
    },

    async validateSession(sessionIdOrUser: string): Promise<boolean> {
        let sessionId = sessionIdOrUser;
        if (sessionIdOrUser.startsWith('0x')) {
            // User address, get sessionId
            sessionId = await redisClient.get(`userSession:${sessionIdOrUser}`) || '';
        }
        if (!sessionId) return false;
        const sessionRaw = await redisClient.get(`session:${sessionId}`);
        if (!sessionRaw) return false;
        const session: SessionData = JSON.parse(sessionRaw);
        if (session.revoked) return false;
        if (Date.now() > session.expiresAt) {
            await this.revokeSession(sessionId, 'expired');
            return false;
        }
        return true;
    },

    async isSessionActive(userAddress: string): Promise<boolean> {
        const sessionId = await redisClient.get(`userSession:${userAddress}`);
        if (!sessionId) return false;
        return this.validateSession(sessionId);
    },

    async getSession(sessionIdOrUser: string): Promise<SessionData | null> {
        let sessionId = sessionIdOrUser;
        if (sessionIdOrUser.startsWith('0x')) {
            sessionId = await redisClient.get(`userSession:${sessionIdOrUser}`) || '';
        }
        if (!sessionId) return null;
        const sessionRaw = await redisClient.get(`session:${sessionId}`);
        return sessionRaw ? JSON.parse(sessionRaw) : null;
    },

    // method: 'telegram' | 'warpcast' | 'email' | 'rbac' | 'expired'
    async revokeSession(sessionIdOrUser: string, method: string = 'user'): Promise<void> {
        let sessionId = sessionIdOrUser;
        if (sessionIdOrUser.startsWith('0x')) {
            sessionId = await redisClient.get(`userSession:${sessionIdOrUser}`) || '';
        }
        if (!sessionId) return;
        const sessionRaw = await redisClient.get(`session:${sessionId}`);
        if (!sessionRaw) return;
        const session: SessionData = JSON.parse(sessionRaw);
        // Remove all but metadata
        const revokedSession: SessionData = {
            sessionId: session.sessionId,
            userAddress: session.userAddress,
            allowEntireWallet: session.allowEntireWallet,
            createdAt: session.createdAt,
            dateOfFirstGrant: session.dateOfFirstGrant,
            dateOfRevoke: Date.now(),
            revoked: true,
            methodForRevokedInfoSentToUser: method as any,
            expiresAt: session.expiresAt,
        };
        await redisClient.set(`session:${sessionId}`, JSON.stringify(revokedSession), { EX: SESSION_TTL });
        await redisClient.del(`userSession:${session.userAddress}`);
    }
};