import React, { useEffect, useState } from 'react';
import '../styles/styles.css';
import type { AppProps } from 'next/app';
import { logger } from '../utils/logger';

function SplashPage({ onComplete }: { onComplete: () => void }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    // Example: Fetch contract info securely from your backend API
    fetch('/api/contract-expiry', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
      if (data.expiry) {
        const expiryDate = new Date(data.expiry);
        const now = new Date();
        const diff = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysLeft(diff);
      }
      })
      .catch(() => setDaysLeft(null));
    const contractExpiry = localStorage.getItem('wally_contract_expiry');
    if (contractExpiry) {
      const expiryDate = new Date(contractExpiry);
      const now = new Date();
      const diff = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      setDaysLeft(diff);
    }
    // Simulate loading
    setTimeout(onComplete, 2000);
  }, [onComplete]);

  return (
    <div className="splash">
      <h1>Welcome to Wally!</h1>
      {daysLeft !== null && (
        <p>
          Your contract expires in <strong>{daysLeft}</strong> days.
        </p>
      )}
      <p>Loading...</p>
    </div>
  );
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
        import('@farcaster/frame-sdk').then(({ sdk }) => {
          if (window.farcaster) {
            window.farcaster.sdk = sdk;
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
  }, []);

  return showSplash ? (
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
  );
}

logger.info('User logged in', { userId: 123 });
logger.warn('API rate limit approaching');
logger.error('Failed to fetch data', { error: 'timeout' });
logger.debug('Debugging details', { foo: 'bar' });

export default MyApp;