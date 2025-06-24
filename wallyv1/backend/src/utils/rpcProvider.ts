/**
 * RPC Provider management with round-robin load balancing
 */
import logger from '../infra/mon/logger.js';

type ChainId = number;

// RPC URL collection by chain ID
const RPC_URLS: Record<ChainId, string[]> = {
  // Optimism
  10: [
    process.env.OPTIMISM_RPC_URL_1,
    process.env.OPTIMISM_RPC_URL_2,
    process.env.OPTIMISM_RPC_URL_3,
  ].filter(Boolean) as string[],

  // Base
  8453: [
    process.env.BASE_RPC_URL_1,
    process.env.BASE_RPC_URL_2,
  ].filter(Boolean) as string[],

  // Add more chains as needed
};

// Fallbacks if no specific RPCs are configured
const FALLBACK_URLS_OPTIMISM: Record<ChainId, string[]> = {
  10: ['https://optimism-mainnet.public.blastapi.io']
};
const FALLBACK_URLS_BASE: Record<ChainId, string[]> = {
  8453: ['https://base-mainnet.public.blastapi.io']
};

// Index pointers for round robin
const rpcIndexes: Record<ChainId, number> = {};

/**
 * Get the next RPC URL in round-robin fashion
 * @param chainId Chain ID (defaults to Optimism)
 * @returns RPC URL
 */
export function getNextRpcUrl(chainId: ChainId = 10): string {
  const urls = RPC_URLS[chainId]?.length > 0
    ? RPC_URLS[chainId]
    : (chainId === 10 ? FALLBACK_URLS_OPTIMISM[chainId] : FALLBACK_URLS_BASE[chainId]);

  if (!urls || urls.length === 0) {
    logger.error(`No RPC URLs configured for chain ${chainId}`);
    throw new Error(`No RPC URLs configured for chain ${chainId}`);
  }

  // Initialize index for this chain if not already done
  if (rpcIndexes[chainId] === undefined) {
    rpcIndexes[chainId] = 0;
  }

  const url = urls[rpcIndexes[chainId]];

  // Move to next URL in round-robin fashion
  rpcIndexes[chainId] = (rpcIndexes[chainId] + 1) % urls.length;

  return url;
}

/**
 * Reset the RPC index for a chain
 * @param chainId Chain ID
 */
export function resetRpcIndex(chainId: ChainId = 10): void {
  rpcIndexes[chainId] = 0;
}
