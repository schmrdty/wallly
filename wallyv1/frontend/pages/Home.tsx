import React, { useEffect } from 'react';
import Auth from '../src/components/Auth';
import Link from 'next/link';
import SIWEButton from '../src/components/SIWEButton';
import { FarcasterSignIn } from '../src/components/FarcasterSignIn';
import { logger } from '../utils/logger';
import { useAuth } from '../src/hooks/useAuth';

const Home = () => {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      logger.info('User logged in', { userId });
    }
  }, [userId]);

  return (
    <div className="container">
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <Auth />
      <p>Automate non-custodial wallet monitoring and transfers.</p>
      <FarcasterSignIn />
      <nav>
        <Link href="/Instructions">Instructions</Link>
        <Link href="/SiWE">SiWE</Link>
        <Link href="/Share">Share</Link>
        <Link href="/Feedback">Feedback</Link>
        <Link href="/Privacy">Privacy</Link>
      </nav>
      <div>
        <strong>Disclaimer:</strong>
        <p>Wally is a non-custodial wallet automation tool</p>
        <strong>Always confirm entries in all fields</strong>
        <br />
        <strong>before proceeding with any transaction/s.</strong>
        <br />
        <strong>Wally does not store your private keys or sensitive information.</strong>
        <p>Wally's developer is not responsible for any losses or damages</p>
        <p>resulting from your interaction with Wally.</p>
        <p>By signing in with your Farcaster or </p>
        <p>Ethereum account and using Wally and/or the underlying technology</p>
        <p>you acknowledge that you have read and understood the terms of service.</p>
        <p>Wally is not a financial advisor and does not provide financial advice.</p>
        <p>Wally is not affiliated with Farcaster or Ethereum.</p>
      </div>
      <p>Wally the Wallet Watcher 2025</p>
      <p>Brought to you by @schmidtiest.eth</p>
    </div>
  );
};

export default Home;