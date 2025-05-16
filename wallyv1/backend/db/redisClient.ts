import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err);
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log('Connected to Redis');
    }
};

export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        console.log('Disconnected from Redis');
    }
};

export default redisClient;