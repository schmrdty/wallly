export function isMiniAppClient(): boolean {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    return (
      url.pathname.startsWith('/mini') ||
      url.searchParams.get('miniApp') === 'true'
    );
  }
  return false;
}

export function isMiniAppSSR(resolvedUrl: string, query: Record<string, any>): boolean {
  return (
    (resolvedUrl && resolvedUrl.startsWith('/mini')) ||
    query.miniApp === 'true'
  );
}

export function tryDetectMiniAppClient(): { isMiniApp: boolean, error?: any } {
  try {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const isMiniApp =
        url.pathname.startsWith('/mini') ||
        url.searchParams.get('miniApp') === 'true';
      return { isMiniApp };
    }
    return { isMiniApp: false };
  } catch (error) {
    return { isMiniApp: false, error };
  }
}
