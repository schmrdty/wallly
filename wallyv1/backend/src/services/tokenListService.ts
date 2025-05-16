import axios from 'axios';
import { Token } from '../../db/index'; // PostgreSQL Token model
import { logError } from '../infrastructure/monitoring/logger';
import { levenshtein } from '../utils/levenshtein';
import { getTokenFromPostgres } from './postgresService';

export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    url?: string;
    [key: string]: any;
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

export async function roundRobinFindToken(query: string): Promise<TokenInfo | null> {
    // 1. Try IPFS lists in round robin order
    for (let i = 0; i < IPFS_LISTS.length; i++) {
        lastIpfsIndex = (lastIpfsIndex + 1) % IPFS_LISTS.length;
        const url = IPFS_LISTS[lastIpfsIndex];
        try {
            const { data } = await axios.get(url);
            const token = data.tokens.find(
                (t: any) =>
                    t.address.toLowerCase() === query.toLowerCase() ||
                    t.symbol.toLowerCase() === query.toLowerCase() ||
                    t.name.toLowerCase() === query.toLowerCase()
            );
            if (token) return token;
        } catch (e) {
            // Continue to next IPFS list
        }
    }
    // 2. Fallback: Static Tokenlist URLs
    for (const url of STATIC_TOKENLIST_URLS) {
        try {
            const { data } = await axios.get(url);
            const token = data.tokens.find(
                (t: any) =>
                    t.address.toLowerCase() === query.toLowerCase() ||
                    t.symbol.toLowerCase() === query.toLowerCase() ||
                    t.name.toLowerCase() === query.toLowerCase()
            );
            if (token) return token;
        } catch (e) {
            // Continue to next static URL
        }
    }
    // 3. Fallback: PostgreSQL
    const token = await Token.findOne({
        where: {
            [Token.sequelize!.Op.or]: [
                { address: query },
                { symbol: query },
                { name: query }
            ]
        }
    });
    return token ? token.toJSON() : null;
}

function findTokenInList(tokens, query) {
  const q = query.toLowerCase();
  return tokens.find(
    t =>
      t.address.toLowerCase() === q ||
      t.symbol.toLowerCase() === q ||
      t.name.toLowerCase() === q
  );
}
// Main: Load token list with all fallbacks and cache
// ...existing imports...

const STATIC_TOKENLIST_URLS = [
    process.env.STATIC_TOKENLIST_URL1,
    process.env.STATIC_TOKENLIST_URL2,
].filter(Boolean);

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
    for (const url of STATIC_TOKENLIST_URLS) {
        try {
            const { data } = await axios.get(url);
            if (data && data.tokens && data.tokens.length) {
                cachedTokenList = data.tokens;
                lastFetch = now;
                return cachedTokenList;
            }
        } catch (e) {
            // Try next URL
        }
    }

    // 3. Fallback: PostgreSQL
    const pgList = await fetchTokenListFromPostgres();
    if (pgList.length) {
        cachedTokenList = pgList;
        lastFetch = now;
        return cachedTokenList;
    }

    throw new Error('Failed to load token list from any source.');
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
setInterval(() => loadTokenList(true).catch(logError), CACHE_TTL_MS);
export async function refreshTokenList(): Promise<TokenInfo[]> {
    return loadTokenList(true);
}