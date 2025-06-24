import { formatUnits, isAddress } from 'viem';
import { levenshtein as levenshteinDistance } from './levenshtein.js';
import logger from '../infra/mon/logger.js';

// Case-insensitive address compare
export function addressesEqual(addr1: string, addr2: string): boolean {
    return addr1.trim().toLowerCase() === addr2.trim().toLowerCase();
}

// Validate Ethereum address format
export function isValidEthereumAddress(address: string): boolean {
    return isAddress(address);
}

// Convert BigInt to readable decimal (for tokens)
export function formatTokenAmount(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
}

// Levenshtein distance (imported for consistency)
export const levenshtein = levenshteinDistance;

// Safe JSON parse
export function safeJsonParse<T>(str: string, fallback: T): T {
    try { return JSON.parse(str); } catch { return fallback; }
}

// Fuzzy match token address (case-insensitive)
export function fuzzyFindTokenByAddress(tokenAddress: string, tokenList: { address: string }[]): { address: string } | null {
    if (!tokenAddress || !Array.isArray(tokenList) || tokenList.length === 0) return null;

    const normalizedAddress = tokenAddress.trim().toLowerCase();
    let closestMatch: { address: string } | null = null;
    let closestDistance = Infinity;

    for (const token of tokenList) {
        const normalizedTokenAddress = token.address.trim().toLowerCase();
        const distance = levenshtein(normalizedAddress, normalizedTokenAddress);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestMatch = token;
        }
    }

    return closestMatch;
}

export const allowedOrigins = ['https://example.com', 'https://app.schmidtiest.xyz'];
export const allowedDestinations = ['https://api.schmidtiest.xyz', 'https://db.schmidtiest.xyz'];

const cache = new Map(); // Basic caching

export async function getHealth(origin: string, destination: string): Promise<string> {
    // Validate origin & destination
    if (!allowedOrigins.includes(origin) || !allowedDestinations.includes(destination)) {
        logger.warn(`Denied request from origin: ${origin} to destination: ${destination}`);
        return 'Request denied: Unauthorized origin or destination';
    }

    // Check cache
    if (cache.has(destination)) {
        logger.info(`Cache hit for ${destination}`);
        return cache.get(destination);
    }

    try {
        const response = await fetch(destination, { method: 'GET' });

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

export function getStatusMessage(): string {
    const statusMessage = process.env.STATUS_MESSAGE;
    return statusMessage || 'Unknown status';
}
