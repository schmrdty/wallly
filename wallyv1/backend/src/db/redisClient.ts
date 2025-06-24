import { createClient, RedisClientType } from 'redis';
import logger from '../infra/mon/logger.js';

class RedisClient {
  private client: RedisClientType | null = null;
  private connectionState: boolean = false;
  private hasLoggedError: boolean = false;

  constructor() {
    this.client = null;
    this.connectionState = false;
    this.hasLoggedError = false;
  }
  async connect(): Promise<void> {
    try {
      if (this.client && this.connectionState) {
        return; // Already connected
      }

      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: false // Disable auto-reconnection to prevent spam
        }
      });

      this.client.on('error', (err) => {
        // Only log the first error to avoid spam
        if (!this.hasLoggedError) {
          logger.error('Redis Client Error - connection failed, continuing without Redis:', err.code || err.message);
          this.hasLoggedError = true;
        }
        this.connectionState = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.connectionState = true;
        this.hasLoggedError = false;
      });

      this.client.on('end', () => {
        logger.info('Redis Client Disconnected');
        this.connectionState = false;
      });

      await this.client.connect();
      this.connectionState = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to connect to Redis:', errorMessage);
      throw new Error(`Redis connection failed: ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.connectionState) {
        await this.client.quit();
        this.connectionState = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to disconnect from Redis:', errorMessage);
    }
  }

  async ping(): Promise<string> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.ping();
    return result || 'PONG';
  }
  async get(key: string): Promise<string | null> {
    try {
      if (!this.client || !this.connectionState) {
        logger.warn('Redis get failed: client not connected');
        return null;
      }
      const result = await this.client.get(key);
      return result || null;
    } catch (error) {
      logger.warn('Redis get operation failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.set(key, value);
    return result === 'OK';
  }
  async setEx(key: string, seconds: number, value: string): Promise<boolean> {
    try {
      if (!this.client || !this.connectionState) {
        logger.warn('Redis setEx failed: client not connected');
        return false;
      }
      const result = await this.client.setEx(key, seconds, value);
      return result === 'OK';
    } catch (error) {
      logger.warn('Redis setEx operation failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
  async del(key: string): Promise<number> {
    try {
      if (!this.client || !this.connectionState) {
        logger.warn('Redis del failed: client not connected');
        return 0;
      }
      const result = await this.client.del(key);
      return result || 0;
    } catch (error) {
      logger.warn('Redis del operation failed:', error instanceof Error ? error.message : 'Unknown error');
      return 0;
    }
  }
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client || !this.connectionState) {
        logger.warn('Redis keys failed: client not connected');
        return [];
      }
      const result = await this.client.keys(pattern);
      return result || [];
    } catch (error) {
      logger.warn('Redis keys operation failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  async exists(key: string): Promise<number> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.exists(key);
    return result || 0;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.expire(key, seconds);
    return Boolean(result);
  }

  async ttl(key: string): Promise<number> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.ttl(key);
    return result || -1;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.hSet(key, field, value);
    return result || 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.hGet(key, field);
    return result || null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.hGetAll(key);
    return (result && typeof result === 'object')
      ? Object.fromEntries(Object.entries(result).map(([k, v]) => [k, String(v)]))
      : {};
  }

  async hdel(key: string, field: string): Promise<number> {
    if (!this.client || !this.connectionState) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.hDel(key, field);
    return result || 0;
  }

  async lPush(key: string, value: string | string[]): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    if (Array.isArray(value)) {
      if (value.length === 0) return 0;
      let result = 0;
      for (const item of value) {
        result = await this.client.lPush(key, item);
      }
      return result;
    }
    return await this.client.lPush(key, value);
  }

  async rPush(key: string, value: string | string[]): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    if (Array.isArray(value)) {
      if (value.length === 0) return 0;
      let result = 0;
      for (const item of value) {
        result = await this.client.rPush(key, item);
      }
      return result;
    }
    return await this.client.rPush(key, value);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.lRange(key, start, stop);
  }

  async lTrim(key: string, start: number, stop: number): Promise<string> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.lTrim(key, start, stop);
  }

  async lLen(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.lLen(key);
  }

  async lSet(key: string, index: number, value: string): Promise<string> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.lSet(key, index, value);
  }

  async lRem(key: string, count: number, value: string): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.lRem(key, count, value);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.hIncrBy(key, field, increment);
  }

  async persist(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis client not connected');
    return await this.client.persist(key);
  }

  isConnected(): boolean {
    return this.connectionState && this.client !== null;
  }
}

const redisClient = new RedisClient();
export default redisClient;
