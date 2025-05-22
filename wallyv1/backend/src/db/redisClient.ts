import { createClient } from 'redis';
import { logError, logInfo } from '../infra/mon/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl,
});
redisClient.on('ready', () => {
    logInfo('Redis client is ready');
});
redisClient.on('error', (err) => {
    logError('Redis Client Error: ' + err.message);
});

redisClient.on('reconnecting', () => {
    logInfo('Redis client reconnecting...');
});

redisClient.on('connect', () => {
    logInfo('Redis client connected');
});

redisClient.on('end', () => {
    logInfo('Redis client connection closed');
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        logInfo('Connected to Redis');
    }
};

export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        logInfo('Disconnected from Redis');
    }
};

export default redisClient;