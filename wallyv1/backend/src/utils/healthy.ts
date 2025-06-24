// health check helpers
import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../infra/mon/logger.js';

export const allowedOrigins = ['https://wally.schmidtiest.xyz/', 'https://app.schmidtiest.xyz/', 'https://schmidtiest.xyz/', 'http://db.schmidtiest.xyz/', 'https://admin.schmidtiest.xyz/', 'http://farcaster.xyz/'];
export const allowedDestinations = ['https://app.schmidtiest.xyz/', 'http://db.schmidtiest.xyz/', 'https://admin.schmidtiest.xyz/', 'https://wally.schmidtiest.xyz/', 'https://schmidtiest.xyz/', 'http://farcaster.xyz/'];

const cache = new Map(); // Basic caching

export async function getHealth(origin: string, destination: string): Promise<string> {
    // Validate origin & destination
    if (
        !allowedOrigins?.length ||
        !allowedDestinations?.length ||
        !allowedOrigins.includes(origin) ||
        !allowedDestinations.includes(destination) ||
        (
            allowedOrigins.every(o => allowedDestinations.includes(o)) &&
            allowedDestinations.every(d => allowedOrigins.includes(d))
        )
    ) {
        logger.warn(`Denied request from origin: ${origin} to destination: ${destination}`);
        return 'Request denied: Unauthorized origin or destination';
    }

    // Check cache
    if (cache.has(destination)) {
        logger.info(`Cache hit for ${destination}`);
        return cache.get(destination);
    }

    try {
        const response = await axios.get(destination);

        let statusMessage;
        if (response.status >= 200 && response.status < 300) {
            statusMessage = `Healthy: Received ${response.status}`;
        } else if (response.status >= 400 && response.status < 500) {
            statusMessage = `Unhealthy: Received ${response.status}`;
        } else if (response.status >= 500) {
            statusMessage = `Not Working: Received ${response.status}`;
        }

        cache.set(destination, statusMessage); // Cache the response
        setTimeout(() => cache.delete(destination), 30000); // Cache expires after 30 sec

        logger.info(`Health check for ${destination}: ${statusMessage}`);
        return statusMessage || 'Unknown status';
    } catch (error) {
        logger.error(`Error reaching ${destination}: ${error}`);
        return `Error: Unable to reach ${destination}`;
    }
}

export function getHealthStatus(): string {
    const statusMessage = process.env.HEALTH_STATUS;
    return statusMessage || 'Unknown status';
}
