import { createPublicClient, http, Chain } from 'viem';
import { optimism, base } from 'viem/chains';

const CHAINS: Record<number, Chain> = {
  10: optimism,
  8453: base,
};

// RPC URLs by chain
const RPC_URLS: Record<number, string[]> = {
  10: [
    process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_1,
    process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_2,
    process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL_3,
  ].filter(Boolean) as string[],
  
  8453: [
    process.env.NEXT_PUBLIC_BASE_RPC_URL_1,
    process.env.NEXT_PUBLIC_BASE_RPC_URL_2,
  ].filter(Boolean) as string[],
};

const FALLBACKS: Record<number, string[]> = {
  10: ['https://optimism-mainnet.public.blastapi.io'],
  8453: ['https://base-mainnet.public.blastapi.io'],
};

// Track RPC index for round-robin
const rpcIndexes: Record<number, number> = {};

/**
 * Get next RPC URL in round-robin fashion
 */
export function getNextRpcUrl(chainId: number = 10): string {
  const urls = RPC_URLS[chainId]?.length > 0 ? RPC_URLS[chainId] : FALLBACKS[chainId];
  
  if (!urls || urls.length === 0) {
    console.error(`No RPC URLs for chain ${chainId}`);
    throw new Error(`No RPC URLs for chain ${chainId}`);
  }

  if (rpcIndexes[chainId] === undefined) {
    rpcIndexes[chainId] = 0;
  }
  
  const url = urls[rpcIndexes[chainId]];
  rpcIndexes[chainId] = (rpcIndexes[chainId] + 1) % urls.length;
  
  return url;
}

/**
 * Get viem public client with the next RPC URL
 */
export function getPublicClient(chainId: number = 10) {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Chain ${chainId} not supported`);
  
  const rpcUrl = getNextRpcUrl(chainId);
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}
