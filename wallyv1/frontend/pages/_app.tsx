import React, { useEffect, useState } from 'react';
import '../styles/styles.css';
import '../styles/dashboard.css';
import '../styles/instructions.css';
import '../styles/settings.css';
import type { AppProps } from 'next/app';
import { logger } from '../src/utils/logger';
import Head from 'next/head';
import SplashPage from '../src/components/SplashPage';
import { AppProvider } from '../src/context/AppContext';
import { AuthKitProvider } from '@farcaster/auth-kit';

// Extend the Window interface to include 'farcaster'
declare global {
  interface Window {
    farcaster?: any;
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    logger.error('App ErrorBoundary caught error', { error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="splash">
          <h1>Something went wrong.</h1>
          <p>Try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const mini =
        url.pathname.startsWith('/mini') ||
        url.searchParams.get('miniApp') === 'true';
      setIsMiniApp(mini);

      if (mini) {
        import('@farcaster/auth-kit').then((authKitModule) => {
          // Replace 'sdk' with the correct export from the module.
          // For example, if the SDK is the default export:
          const sdk = authKitModule.default || authKitModule.sdk || authKitModule;
          if (window.farcaster) {
            window.farcaster.sdk = sdk;
            // If sdk.init does not exist, configure the SDK as per its documentation or remove this block.
            // Example: If configuration is done via constructor or another method, use that instead.
            // Remove or update the following lines as appropriate:
             sdk.init({
               appName: 'Wally the Wallet Watcher',
               appVersion: '1.0.0',
               appUrl: 'https://wally.schmidtiest.xyz',
               splashImageUrl: 'https://wally.schmidtiest.xyz/logo.png',
               splashBackgroundColor: '#f5f0ec',
             });
            sdk.actions.ready();
            sdk.actions.setTitle('Wally the Wallet Watcher');
            sdk.actions.setImage('https://wally.schmidtiest.xyz/logo.png');
          }
          window.farcaster?.track?.('mini-app-opened');
          document.body.classList.add('mini-app-mode');
        });
      }
    }
    // Global error handler for unhandled promise rejections
    const handler = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', { reason: event.reason });
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  const userId = pageProps?.user?.id;
  useEffect(() => {
    logger.info('User logged in', { userId });
    logger.warn('API rate limit approaching', { userId });
    logger.error('Failed to fetch data', { error: 'timeout', userId });
    logger.debug('Debugging details', { foo: 'bar', userId });
  }, [userId]);

  // Add your config (replace with your actual values)
  const authKitConfig = {
    domain: 'wally.schmidtiest.xyz',
    siweUri: 'https://wally.schmidtiest.xyz/login',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    relay: 'https://relay.farcaster.xyz',
    // version: 'v1', // optional
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Wally the Wallet Watcher</title>
      </Head>
      <ErrorBoundary>
        <AuthKitProvider config={authKitConfig}>
          <AppProvider>
            {showSplash ? (
              <SplashPage onComplete={() => setShowSplash(false)} />
            ) : (
              <>
                {isMiniApp && (
                  <div className="mini-app-banner">
                    <strong>Mini App Mode:</strong> It's Wally the Mini App.
                  </div>
                )}
                <Component {...pageProps} isMiniApp={isMiniApp} />
              </>
            )}
          </AppProvider>
        </AuthKitProvider>
      </ErrorBoundary>
    </>
  );
}

export default MyApp;