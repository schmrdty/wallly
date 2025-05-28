'use client';
import Head from 'next/head';
import { logger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
import React from 'react';
import { useRouter } from 'next/navigation';
export default function Index() {
  const { user } = useAuth();
  const userId = user?.id;
const router = useRouter();
  const isMiniApp = typeof window !== 'undefined' && window.navigator.userAgent.includes('FarcasterMiniApp');
  // Redirect to dashboard if user is authenticated
  React.useEffect(() => {
    if (userId) {
      router.replace('/dashboard');
    }
  }, [userId, router]);
  const isMobile = typeof window !== 'undefined' && /Mobi|Android/i.test(window.navigator.userAgent);
  // Log user actions and API calls
  React.useEffect(() => {
    if (isMiniApp) {
      logger.info('Mini App detected', { userId });
    } else {
      logger.info('Web App detected', { userId });
    }
    if (isMobile) {
      logger.info('User is on a mobile device', { userId });
    } else {
      logger.info('User is on a desktop device', { userId });
    }
    logger.info('Page loaded', { userId });
  }, [userId, isMiniApp, isMobile]);
  // Only log when userId is available
  React.useEffect(() => {
    if (userId) {
      logger.info('User logged in', { userId });
    }
    logger.warn('API rate limit approaching');
    logger.error('Failed to fetch data', { error: 'timeout' });
    logger.debug('Debugging details', { foo: 'bar' });
  }, [userId]);

  const frame = {
    version: "next",
    imageUrl: "https://wally.schmidtiest.xyz/wally-preview.png",
    button: {
      title: "Launch Wally",
      action: {
        type: "launch_frame",
        url: "https://wally.schmidtiest.xyz",
        name: "Wally the Wallet Watcher",
        splashImageUrl: "https://wally.schmidtiest.xyz/logo.png",
        splashBackgroundColor: "#f5f0ec"
      }
    }
  };

  return (
    <>
      <Head>
        {/* Farcaster Mini App Embed */}
        <meta name="fc:frame" content={JSON.stringify(frame)} />
        <meta name="fc:frame:version" content={frame.version} />
        <meta name="fc:frame:image" content={frame.imageUrl} />
        

        {/* Open Graph (for social sharing on Twitter, Facebook, Discord, etc.) */}
        <meta property="og:title" content="Wally the Wallet Watcher" />
        <meta property="og:description" content="Automate your wallet with Wally. Select tokens, set minimums, authorize & enjoy." />
        <meta property="og:image" content="https://wally.schmidtiest.xyz/wally-preview.png" />
        <meta property="og:url" content="https://wally.schmidtiest.xyz" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wally the Wallet Watcher" />
        <meta name="twitter:description" content="Automate your wallet with Wally. Select tokens, set minimums, authorize & enjoy." />
        <meta name="twitter:image" content="https://wally.schmidtiest.xyz/wally-preview.png" />

        {/* Basic SEO */}
        <title>Wally the Wallet Watcher</title>
        <meta name="description" content="Automate your wallet with Wally. Select tokens, set minimums, authorize & enjoy." />
      </Head>
    </>
  );
}