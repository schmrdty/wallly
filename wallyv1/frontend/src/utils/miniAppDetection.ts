// Try to import the real SDK, fall back to mock if not available
let sdk: any;
try {
  sdk = require('@farcaster/frame-sdk').sdk;
} catch (error) {
  console.warn('Real @farcaster/frame-sdk not available, using mock');
  sdk = require('../lib/frameSDK').sdk;
}

export async function isMiniAppClient(): Promise<boolean> {
  try {
    return await sdk.isInMiniApp();
  } catch (error) {
    console.warn('Failed to detect mini app status:', error);
    return false;
  }
}

// Legacy function for backward compatibility
export function tryDetectMiniAppClient(): boolean {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    return (
      url.pathname.startsWith('/mini') ||
      url.searchParams.get('miniApp') === 'true'
    );
  }
  return false;
}

// For SSR
export function isMiniAppSSR(resolvedUrl: string, query: Record<string, any>): boolean {
  return (
    (resolvedUrl && resolvedUrl.startsWith('/mini')) ||
    query.miniApp === 'true'
  );
}
