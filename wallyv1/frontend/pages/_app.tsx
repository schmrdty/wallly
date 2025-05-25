import React, { useEffect, useState } from 'react';
import '../styles/styles.css';
import type { AppProps } from 'next/app';
import { logger } from '../src/utils/logger';
import Head from 'next/head';
import SplashPage from '../src/components/SplashPage';
import { AppProvider } from '../src/context/AppContext';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { http } from 'wagmi';
import { base } from 'wagmi/chains';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getRpcUrl } from '../src/utils/rpcService';
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';


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

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'Wally the Wallet Watcher',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  chains: [base],
  transports: {
    [base.id]: http(getRpcUrl()),
  },
  ssr: true,
});

function isMiniAppRequest() {
  return tryDetectMiniAppClient() || window.location.pathname.startsWith('/mini');
}

function MyApp({ Component, pageProps }: AppProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (isMiniAppRequest()) {
      setIsMiniApp(true);
      // Optionally lazy-load the SDK only in Mini App mode
      import('@farcaster/frame-sdk').then(({ sdk }) => {
        // Optionally call sdk.actions.ready() or other Mini App-specific logic
        if (sdk?.actions?.ready) sdk.actions.ready();
      });
      document.body.classList.add('mini-app-mode');
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

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Wally the Wallet Watcher</title>
      </Head>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={config}>
          <RainbowKitProvider>
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
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;