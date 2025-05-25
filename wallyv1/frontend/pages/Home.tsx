import React, { useEffect } from 'react';
import Auth from '../src/components/Auth';
import { FarcasterSignIn } from '../src/components/FarcasterSignIn';
import SIWEButton from '../src/components/SIWEButton';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'next/router';
import { Disclaimer } from '../src/components/Disclaimer';
import { HomeNav } from '../src/components/HomeNav';
import styles from '../styles/Home.module.css';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';

const Home = () => {
  const { user, signInWithFarcaster, signInWithEthereum } = useAuth();
  const userId = user?.id;
  const router = useRouter();

  const isMiniAppClient = tryDetectMiniAppClient();

  useEffect(() => {
    if (userId) {
      logger.info('User logged in', { userId });
    }
  }, [userId]);

  const handleFarcasterSuccess = (user: any) => {
    signInWithFarcaster(user);
    logger.info('Farcaster sign-in successful', { userId: user.id });
    router.push('/Dashboard');
  };

  const handleFarcasterError = () => {
    router.push('/');
  };

  const handleSIWESuccess = (user: any) => {
    signInWithEthereum(user);
    logger.info('SIWE sign-in successful', { userId: user.id });
    router.push('/Dashboard');
  };

  const { isMiniApp } = isMiniAppClient;

  return (
    <div className={styles.container}>
      {isMiniApp && <MiniAppBanner />}
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <Auth />
      <p>Automate non-custodial wallet monitoring and transfers.</p>
      <br />
      <p>While in Beta, Wally is Whitelisted; contact @schmidtiest.base.eth for more info.</p>
      <p>Sign in with:</p>
      <FarcasterSignIn onSuccess={handleFarcasterSuccess} onError={handleFarcasterError} />
      {user?.authProvider === 'farcaster' && (
        <p>Signed in with Farcaster</p>
      )}
      <p>or</p>
      <SIWEButton onSuccess={handleSIWESuccess} />
      {user?.authProvider === 'ethereum' && (
        <p>Signed in with Ethereum</p>
      )}
      <HomeNav />
      <Disclaimer />
      <p>Wally the Wallet Watcher 2025</p>
      <p>Brought to you by @schmidtiest.eth</p>
    </div>
  );
};

export default Home;

