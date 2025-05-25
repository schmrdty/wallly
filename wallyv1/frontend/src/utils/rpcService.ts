const RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL_1,
  process.env.NEXT_PUBLIC_RPC_URL_2,
  process.env.NEXT_PUBLIC_RPC_URL_3,
  process.env.NEXT_PUBLIC_RPC_URL_4,
  process.env.NEXT_PUBLIC_RPC_URL_5,
].filter((url): url is string => typeof url === 'string' && url.length > 0);

// Cryptographically secure random integer in [0, max)
function secureRandomInt(max: number): number {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  // Fallback for Node.js or environments without crypto
  return Math.floor(Math.random() * max);
}

let lastRpcIndex = secureRandomInt(RPC_URLS.length);

/**
 * Returns the next RPC URL in a round-robin fashion.
 */
export function getRpcUrl(): string {
  if (RPC_URLS.length === 0) {
    throw new Error('No RPC URLs configured');
  }
  lastRpcIndex = (lastRpcIndex + 1) % RPC_URLS.length;
  return RPC_URLS[lastRpcIndex];
}
