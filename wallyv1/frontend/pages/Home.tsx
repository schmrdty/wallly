import React, { useEffect } from 'react';
import Auth from '../src/components/Auth';
import { FarcasterSignIn } from '../src/components/FarcasterSignIn';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/hooks/useAuth';
import { useRouter } from 'next/router';
import { InstructionsGettingStarted } from '../src/components/InstructionsGettingStarted';
import { Disclaimer } from '../src/components/Disclaimer';
import { HomeNav } from '../src/components/HomeNav';
import styles from '../styles/Home.module.css';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { grantPermissions } from '@reown/appkit-experimental/smart-session';
import { useAppKit } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';

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
        abi: [], // Replace with your contract's ABI
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

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className={styles.container}>
      <ThemeToggle />
      {isMiniApp && <MiniAppBanner />}
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <Auth />
      <InstructionsGettingStarted />
      <p>Automate non-custodial wallet monitoring and transfers.</p>
      <br />
      <p>While in Beta, Wally is Whitelisted; contact @schmidtiest.base.eth for more info.</p>
      <p>Sign in with:</p>
      {!user && (
        <>
          <FarcasterSignIn onSuccess={handleFarcasterSuccess} onError={handleFarcasterError} />
          <p>or</p>
          <button onClick={() => open()}>Sign in with Wallet</button>
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

