import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const domain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : (process.env.NEXT_PUBLIC_DOMAIN || 'wally.schmidtiest.xyz');
const id = uuidv4();

// Create app client dynamically to handle ESM imports with proper error handling
let appClient: any = null;

async function getAppClient() {
  if (!appClient) {
    try {
      // Use dynamic ES module import with proper await
      const authClientModule = await import('@farcaster/auth-client');

      // Handle both default and named exports properly
      const createAppClient = authClientModule.createAppClient || authClientModule.default?.createAppClient;
      const viemConnector = authClientModule.viemConnector || authClientModule.default?.viemConnector;

      if (!createAppClient || !viemConnector) {
        throw new Error('Failed to import required functions from @farcaster/auth-client');
      }

      appClient = createAppClient({
        relay: process.env.FARCASTER_RELAY_URL || 'https://relay.farcaster.xyz',
        ethereum: viemConnector(),
        version: 'v1',
      });
    } catch (error) {
      console.error('Failed to create Farcaster app client:', error);
      throw error;
    }
  }
  return appClient;
}

/**
 * Generate a nonce for SIWE (if needed)
 */
export function getFarcasterNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Parse a Sign In With Farcaster URI
 */
export function parseSignInURI({ uri }: { uri: string }) {
  try {
    // Example: farcaster://connect?channelToken=...&nonce=...&siweUri=...&domain=...
    const url = new URL(uri);
    const params = Object.fromEntries(url.searchParams.entries());
    if (!params.domain || !params.nonce) {
      return {
        channelToken: params.channelToken || '',
        params: {
          domain: params.domain || '',
          uri,
          nonce: params.nonce || '',
        },
        isError: true,
        error: new Error('Missing domain or nonce'),
      };
    }
    return {
      channelToken: params.channelToken || '',
      params: {
        domain: params.domain,
        uri,
        nonce: params.nonce,
        notBefore: params.notBefore,
        expirationTime: params.expirationTime,
        requestId: params.requestId,
      },
      isError: false,
    };
  } catch (error: any) {
    return {
      channelToken: '',
      params: {
        domain: '',
        uri,
        nonce: '',
      },
      isError: true,
      error,
    };
  }
}

/**
 * Verify a SIWF message using official Farcaster Auth Client with enhanced security
 */
export async function verifySiwfMessage({
  message,
  signature,
  domain: customDomain,
  nonce,
}: {
  message: string;
  signature: string;
  domain?: string;
  nonce?: string;
}) {
  try {
    const verifyDomain = customDomain || domain;
    const client = await getAppClient();

    // Enhanced verification using official Farcaster Auth Client API
    const result = await client.verifySignInMessage({
      nonce: nonce || extractNonceFromMessage(message),
      domain: verifyDomain,
      message,
      signature: signature as `0x${string}`,
    });

    return {
      success: result.success,
      fid: result.fid,
      data: result.data,
      isError: result.isError,
      error: result.error,
    };
  } catch (error: any) {
    console.error('SIWF verification error:', error);
    return {
      success: false,
      fid: null,
      data: null,
      isError: true,
      error: error,
    };
  }
}

/**
 * Extract nonce from SIWE message if not provided separately
 */
function extractNonceFromMessage(message: string): string {
  const siweMessage = String(message);
  const nonceMatch = siweMessage.match(/Nonce: ([^\n\r]+)/);
  return nonceMatch ? nonceMatch[1].trim() : crypto.randomBytes(16).toString('hex');
}

/**
 * Enhanced Farcaster response type matching official API
 */
export type FarcasterResponse = {
  isError: boolean;
  error?: Error;
  data?: {
    state: 'pending' | 'completed';
    fid?: number;
    username?: string;
    bio?: string;
    displayName?: string;
    pfpUrl?: string;
    custody?: string;
    verifications?: string[];
    message?: string;
    signature?: string;
    nonce?: string;
  };
};

/**
 * Create a Farcaster Auth channel for sign-in flow
 */
export async function createFarcasterChannel({
  siweUri,
  domain: customDomain,
  nonce,
}: {
  siweUri: string;
  domain?: string;
  nonce?: string;
}) {
  try {
    const channelDomain = customDomain || domain;
    const channelNonce = nonce || getFarcasterNonce();
    const client = await getAppClient();

    const result = await client.createChannel({
      siweUri,
      domain: channelDomain,
      nonce: channelNonce,
    });

    return {
      success: !result.isError,
      channelToken: result.data?.channelToken,
      url: result.data?.url,
      nonce: result.data?.nonce || channelNonce,
      isError: result.isError,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Failed to create Farcaster channel:', error);
    return {
      success: false,
      channelToken: null,
      url: null,
      nonce: null,
      isError: true,
      error: error,
    };
  }
}

/**
 * Check the status of a Farcaster Auth channel
 */
export async function getFarcasterChannelStatus(channelToken: string) {
  try {
    const client = await getAppClient();
    const result = await client.status({ channelToken });

    return {
      success: !result.isError,
      data: result.data,
      isError: result.isError,
      error: result.error,
    };
  } catch (error: any) {
    console.error('Failed to get channel status:', error);
    return {
      success: false,
      data: null,
      isError: true,
      error: error,
    };
  }
}
