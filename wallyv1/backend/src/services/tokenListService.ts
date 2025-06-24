import axios from 'axios';
import logger from '../infra/mon/logger.js';
import { levenshtein } from '../utils/levenshtein.js';

export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    url?: string;
    [key: string]: any;
    // Add more properties as needed
}

const IPFS_LISTS = [
    process.env.IPFS_LIST1,
    process.env.IPFS_LIST2,
    process.env.IPFS_LIST3,
    process.env.IPFS_LIST4,
].filter(Boolean);

const STATIC_TOKENLIST_URLS = [
    process.env.STATIC_TOKENLIST_URL1,
    process.env.STATIC_TOKENLIST_URL2,
].filter(Boolean);

let lastIpfsIndex = Math.floor(Math.random() * IPFS_LISTS.length);

let cachedTokenList: TokenInfo[] = [];
let lastFetch: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Helper to find a token in a list by address, symbol, or name
function findTokenInList(tokens: TokenInfo[], query: string): TokenInfo | undefined {
    const q = query.toLowerCase();
    return tokens.find(
        t =>
            t.address.toLowerCase() === q ||
            t.symbol.toLowerCase() === q ||
            t.name.toLowerCase() === q
    );
}

// Fetch token list from IPFS sources
async function fetchTokenListFromIPFS(): Promise<TokenInfo[]> {
    for (let i = 0; i < IPFS_LISTS.length; i++) {
        lastIpfsIndex = (lastIpfsIndex + 1) % IPFS_LISTS.length;
        const url = IPFS_LISTS[lastIpfsIndex];
        if (!url) continue;
        try {
            const { data } = await axios.get(url);
            if (data && data.tokens && data.tokens.length) {
                return data.tokens;
            }
        } catch (e) {
            // Continue to next IPFS list
        }
    }
    return [];
}

// Fetch token list from static URLs
async function fetchTokenListFromStatic(): Promise<TokenInfo[]> {
    for (const url of STATIC_TOKENLIST_URLS) {
        if (!url) continue;
        try {
            const { data } = await axios.get(url);
            if (data && data.tokens && data.tokens.length) {
                return data.tokens;
            }
        } catch (e) {
            // Continue to next static URL
        }
    }
    logger.warn('No static token list URLs configured or all failed.');
    return [];
}
// Main: Load token list with all fallbacks and cache
export async function loadTokenList(forceReload = false): Promise<TokenInfo[]> {
    const now = Date.now();
    if (!forceReload && cachedTokenList.length && now - lastFetch < CACHE_TTL_MS) {
        return cachedTokenList;
    }

    // 1. Try IPFS
    const ipfsList = await fetchTokenListFromIPFS();
    if (ipfsList && ipfsList.length) {
        cachedTokenList = ipfsList;
        lastFetch = now;
        return cachedTokenList;
    }

    // 2. Fallback: Static Tokenlist URLs
    const staticList = await fetchTokenListFromStatic();
    if (staticList && staticList.length) {
        cachedTokenList = staticList;
        lastFetch = now;
        return cachedTokenList;
    }
    throw new Error('Failed to load token list from any source.');
}

// Round robin token search (tries all sources in order)
export async function roundRobinFindToken(query: string): Promise<TokenInfo | null> {
    // 1. Try IPFS lists in round robin order
    const ipfsList = await fetchTokenListFromIPFS();
    const ipfsToken = findTokenInList(ipfsList, query);
    if (ipfsToken) return ipfsToken;

    // 2. Fallback: Static Tokenlist URLs
    const staticList = await fetchTokenListFromStatic();
    const staticToken = findTokenInList(staticList, query);
    if (staticToken) return staticToken;

    // No token found in any source
    return null;
}

// Helper: Fuzzy search for token by address
export function fuzzyFindTokenByAddress(address: string, maxDistance = 2): TokenInfo | undefined {
    let best: { token?: TokenInfo; dist: number } = { dist: Number.MAX_SAFE_INTEGER };
    for (const token of cachedTokenList) {
        const dist = levenshtein(address.toLowerCase(), token.address.toLowerCase());
        if (dist < best.dist && dist <= maxDistance) {
            best = { token, dist };
        }
    }
    return best.token;
}

// Token lookup helpers
export function findTokenByAddress(address: string): TokenInfo | undefined {
    return cachedTokenList.find(t => t.address.toLowerCase() === address.toLowerCase());
}
export function findTokenBySymbol(symbol: string): TokenInfo | undefined {
    return cachedTokenList.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
}
export function findTokenByName(name: string): TokenInfo | undefined {
    return cachedTokenList.find(t => t.name.toLowerCase() === name.toLowerCase());
}

// Periodically refresh the token list cache
// setInterval(() => loadTokenList(true).catch(logger.error), CACHE_TTL_MS);

export async function refreshTokenList(): Promise<TokenInfo[]> {
    return loadTokenList(true);
}
