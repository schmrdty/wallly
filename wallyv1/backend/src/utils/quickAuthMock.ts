import jwt from 'jsonwebtoken';
import logger from '../infra/mon/logger.js';

/**
 * Mock Quick Auth client for development when @farcaster/quick-auth is not available
 * This provides the same API interface as the real quick-auth package
 */
export function createClient() {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

    return {
        /**
         * Verify JWT token - compatible with @farcaster/quick-auth API
         */
        async verifyJwt({ token, domain }: { token: string; domain: string }) {
            try {
                if (process.env.NODE_ENV === 'development') {
                    // In development, decode without verification for testing
                    const decoded = jwt.decode(token) as any;
                    if (!decoded || typeof decoded !== 'object') {
                        throw new Error('Invalid token structure');
                    }

                    logger.warn('Using mock quick-auth verification - not secure for production!', { domain });

                    return {
                        sub: decoded.sub || decoded.fid || 1,
                        address: decoded.address || '0x0000000000000000000000000000000000000000',
                        fid: decoded.fid || decoded.sub || 1,
                        exp: decoded.exp,
                        iat: decoded.iat,
                        aud: domain,
                        iss: 'mock-auth-server'
                    };
                }

                // In production, attempt real verification
                const verified = jwt.verify(token, secret) as any;
                return {
                    sub: verified.sub,
                    address: verified.address,
                    fid: verified.fid || verified.sub,
                    exp: verified.exp,
                    iat: verified.iat,
                    aud: verified.aud || domain,
                    iss: verified.iss || 'wally-auth'
                };
            } catch (error) {
                logger.error('JWT verification failed:', error);
                throw new Error('Token verification failed');
            }
        },

        /**
         * Create a development JWT for testing
         */
        async createDevToken(fid: number, address?: string, domain?: string) {
            if (process.env.NODE_ENV !== 'development') {
                throw new Error('Dev token creation only allowed in development');
            }

            const payload = {
                sub: fid,
                fid,
                address: address || `farcaster:${fid}`,
                iss: 'wally-dev',
                aud: domain || 'localhost:3000',
                exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
                iat: Math.floor(Date.now() / 1000)
            };

            return jwt.sign(payload, secret);
        }
    };
}

export default { createClient };
