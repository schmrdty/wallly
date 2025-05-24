import axios from "axios";
import levenshtein from "js-levenshtein";
import { logger } from "./logger";

/**
 * Token type definition.
 */
interface Token {
  address: string;
  symbol: string;
  name: string;
  [key: string]: any;
}

const IPFS_LISTS: string[] = [
  process.env.NEXT_PUBLIC_IPFS_LIST1,
  process.env.NEXT_PUBLIC_IPFS_LIST2,
  process.env.NEXT_PUBLIC_IPFS_LIST3,
  process.env.NEXT_PUBLIC_IPFS_LIST4,
].filter((v): v is string => typeof v === "string" && v.length > 0);

/**
 * Helper: Find a token by symbol, name, or address (case-insensitive).
 */
function findToken(tokens: Token[], input: string): Token | undefined {
  const inputLower = input.toLowerCase();
  return tokens.find(
    t =>
      t.address.toLowerCase() === inputLower ||
      t.symbol.toLowerCase() === inputLower ||
      t.name.toLowerCase() === inputLower
  );
}

/**
 * Helper: Fuzzy match a token by symbol or name using Levenshtein distance.
 */
function fuzzyMatchToken(tokens: Token[], input: string): { token: Token | null, distance: number } {
  let bestMatch: Token | null = null;
  let bestDistance = Infinity;
  const inputLower = input.toLowerCase();
  for (const t of tokens) {
    const distances = [
      levenshtein(t.symbol.toLowerCase(), inputLower),
      levenshtein(t.name.toLowerCase(), inputLower),
    ];
    const minDist = Math.min(...distances);
    if (minDist < bestDistance) {
      bestDistance = minDist;
      bestMatch = t;
    }
  }
  return { token: bestMatch, distance: bestDistance };
}

/**
 * Attempts to resolve a token from multiple IPFS lists using symbol, address, or fuzzy match.
 * @param input The user input (symbol, address, or name).
 * @returns Token match result.
 */
export async function roundRobinTokenResolve(input: string): Promise<{
  valid: boolean,
  suggestion?: string,
  symbol?: string,
  name?: string,
  address?: string
}> {
  let allTokens: Token[] = [];

  // Gather all tokens from all lists
  for (const url of IPFS_LISTS) {
    try {
      const { data } = await axios.get(url);
      if (Array.isArray(data.tokens)) {
        allTokens = allTokens.concat(data.tokens);
      }
    } catch (e) {
      logger.warn(`Failed to fetch token list from ${url}`, { error: e });
    }
  }

  if (allTokens.length === 0) {
    return { valid: false };
  }

  const inputTrim = input.trim();
  const inputLower = inputTrim.toLowerCase();

  // $SYMBOL search
  if (inputTrim.startsWith("$")) {
    const symbol = inputTrim.slice(1).toLowerCase();
    const found = allTokens.find(
      (t: Token) => t.symbol.toLowerCase() === symbol
    );
    if (found) {
      return { valid: true, symbol: found.symbol, name: found.name, address: found.address };
    }
  }

  // 0x... address search (40 hex chars after 0x)
  if (/^0x[a-fA-F0-9]{40}$/.test(inputTrim)) {
    const found = allTokens.find(
      (t: Token) => t.address.toLowerCase() === inputLower
    );
    if (found) {
      return { valid: true, symbol: found.symbol, name: found.name, address: found.address };
    }
  }

  // Fuzzy match (Levenshtein) for symbol or name
  const { token: bestMatch, distance: bestDistance } = fuzzyMatchToken(allTokens, inputLower);
  if (bestMatch && bestDistance <= 2) {
    return { valid: false, suggestion: bestMatch.name, symbol: bestMatch.symbol, address: bestMatch.address };
  }

  return { valid: false };
}