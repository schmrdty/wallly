"use client";
import React, { useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // <-- FIXED
import { InstructionsGettingStarted } from '@/components/InstructionsGettingStarted';
import { Disclaimer } from '@/components/Disclaimer';
import { HomeNav } from '@/components/HomeNav';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '@/components/MiniAppBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { grantPermissions } from '@reown/appkit-experimental/smart-session';
import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import wallyv1Abi from '@/abis/wallyv1.json';
import wallyv1MinimalAbi from '@/abis/wallyv1HomeAbi';
import { sdk } from '@farcaster/frame-sdk';

const Home = () => {
  const { user, signInWithFarcaster, logoutUser, isAuthenticated } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const isMiniApp = tryDetectMiniAppClient();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  useEffect(() => {
    if (userId) {
      logger.info('User logged in', { userId });
    }
  }, [userId]);

  const handleFarcasterSuccess = (user: any) => {
    signInWithFarcaster(user);
    logger.info('Farcaster sign-in successful', { userId: user.id });
    router.push('/dashboard');
  };

  const handleFarcasterError = () => {
    router.push('/');
  };

  const handleSignOut = () => {
    logoutUser ? logoutUser() : localStorage.removeItem('user');
    router.push('/');
  };

  const handleGrantPermissions = async () => {
    try {
      const publicKeyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/signer`);
      const { publicKey: dAppECDSAPublicKey } = await publicKeyResponse.json();

      const dataForRequest = {
        dAppECDSAPublicKey,
        chainId: 8453, // Base Mainnet
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        abi: wallyv1Abi, // Replace with your contract's ABI
        functionName: 'store', // Replace with the function you want to allow
        expiry: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        userAddress: address as `0x${string}`,
      };

      const request = {
        expiry: dataForRequest.expiry,
        chainId: `0x${dataForRequest.chainId.toString(16)}` as `0x${string}`,
        address: dataForRequest.userAddress,
        signer: {
          type: "keys" as const,
          data: {
            keys: [
              {
                type: "secp256k1" as const,
                publicKey: dataForRequest.dAppECDSAPublicKey,
              },
            ],
          },
        },
        permissions: [
          {
            type: "contract-call" as const,
            data: {
              address: dataForRequest.contractAddress,
              abi: dataForRequest.abi,
              functions: [{ functionName: dataForRequest.functionName }],
            },
          },
        ],
        policies: [],
      };

      const approvedPermissions = await grantPermissions(request);
      console.log('Permissions granted:', approvedPermissions);
    } catch (err) {
      console.error('Error granting permissions:', err);
    }
  };

  // Farcaster sign-in
  const handleFarcasterSignIn = async () => {
    try {
      const nonce = Math.random().toString(36).slice(2, 12) + Date.now();
      const result = await sdk.actions.signIn({ nonce, acceptAuthAddress: true });
      // You must send result to your backend for verification
      logger.info('Farcaster SIWF result', result);
      // Optionally, update user state or redirect
    } catch (err) {
      logger.error('Farcaster sign-in failed', err);
    }
  };

  // Add Mini App
  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
      logger.info('Mini App added');
    } catch (err) {
      logger.error('Add Mini App failed', err);
    }
  };

  // Share logic (copy URL or show instructions)
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Wally the Wallet Watcher',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('App URL copied to clipboard!');
    }
  };

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="container">
      <ThemeToggle />
      {isMiniApp && <MiniAppBanner />}
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <InstructionsGettingStarted />
      <p>Automate non-custodial wallet monitoring and transfers.</p>
      <br />
      <p>While in Beta, Wally is Whitelisted; contact @schmidtiest.base.eth for more info.</p>
      <p>Sign in with:</p>
      {!user && (
        <>
          {/* Only use the AppKit sign-in button */}
          <appkit-button />
        </>
      )}
      {user && (
        <button onClick={handleSignOut}>
          Sign Out (Clear LocalStorage)
        </button>
      )}
      {user?.authProvider === 'farcaster' && <p>Signed in with Farcaster</p>}
      {isConnected && (
        <div>
          <button onClick={handleGrantPermissions}>Grant Permissions</button>
        </div>
      )}
      <div className="flex flex-wrap gap-4 my-4 justify-center">
        <button onClick={handleFarcasterSignIn} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Sign In with Farcaster</button>
        <button onClick={handleAddMiniApp} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Add Mini App</button>
        <button onClick={handleShare} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Share</button>
      </div>
      <HomeNav />
      <Disclaimer />
      <div style={{ marginTop: 24, fontSize: '0.9em', color: '#888' }}>
        <Link href="/terms">Terms of Use</Link>
      </div>
      <p style={{ marginTop: 16 }}>Wally the Wallet Watcher 2025</p>
      <p>Brought to you by @schmidtiest.eth</p>
    </div>
  );
};

export default Home;
