interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private storage: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            keyGenerator: (id) => id,
            ...config,
        };
    }

    isAllowed(identifier: string): boolean {
        const key = this.config.keyGenerator!(identifier);
        const now = Date.now();
        const entry = this.storage.get(key);

        // Clean up expired entries periodically
        this.cleanup(now);

        if (!entry || now >= entry.resetTime) {
            // First request or window expired
            this.storage.set(key, {
                count: 1,
                resetTime: now + this.config.windowMs,
            });
            return true;
        }

        if (entry.count >= this.config.maxRequests) {
            // Rate limit exceeded
            return false;
        }

        // Increment count
        entry.count++;
        return true;
    }

    getRemainingRequests(identifier: string): number {
        const key = this.config.keyGenerator!(identifier);
        const entry = this.storage.get(key);

        if (!entry || Date.now() >= entry.resetTime) {
            return this.config.maxRequests;
        }

        return Math.max(0, this.config.maxRequests - entry.count);
    }

    getResetTime(identifier: string): number {
        const key = this.config.keyGenerator!(identifier);
        const entry = this.storage.get(key);

        if (!entry || Date.now() >= entry.resetTime) {
            return 0;
        }

        return entry.resetTime;
    }

    private cleanup(now: number): void {
        // Clean up expired entries every 100 checks (simple cleanup strategy)
        if (Math.random() < 0.01) {
            for (const [key, entry] of this.storage.entries()) {
                if (now >= entry.resetTime) {
                    this.storage.delete(key);
                }
            }
        }
    }

    reset(identifier?: string): void {
        if (identifier) {
            const key = this.config.keyGenerator!(identifier);
            this.storage.delete(key);
        } else {
            this.storage.clear();
        }
    }
}

// Pre-configured rate limiters for common use cases
export const apiRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
});

export const feedbackRateLimiter = new RateLimiter({
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
});

export const transferRateLimiter = new RateLimiter({
    maxRequests: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
});

export { RateLimiter };
export type { RateLimitConfig };