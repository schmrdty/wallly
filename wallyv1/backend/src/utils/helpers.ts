import { BigNumber, ethers } from 'ethers';
import { levenshtein as levenshteinDistance } from './levenshtein';

// Case-insensitive address compare
export function addressesEqual(addr1: string, addr2: string): boolean {
    return addr1.trim().toLowerCase() === addr2.trim().toLowerCase();
}

// Validate Ethereum address format
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Convert BigNumber to readable decimal (for tokens)
export function formatTokenAmount(amount: BigNumber, decimals: number): string {
    return ethers.utils.formatUnits(amount, decimals);
}

// Levenshtein distance (imported for consistency)
export const levenshtein = levenshteinDistance;

// Safe JSON parse
export function safeJsonParse<T>(str: string, fallback: T): T {
    try { return JSON.parse(str); } catch { return fallback; }
}