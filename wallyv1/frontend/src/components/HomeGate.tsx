'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth.ts';

export default function HomeGate() {
  const { user, isAuthenticated, loading, error, signInWithEthereum } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', marginTop: 64 }}>
        <h1>Welcome to Wally the Wallet Watcher V1</h1>
        <p>Sign in with Farcaster to continue.</p>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        <button
          onClick={() =>
            signInWithEthereum('secure-nonce-' + Date.now(), user?.walletAddress ?? '')
          }
          style={{ padding: '12px 32px', fontSize: 18 }}
        >
          Sign in with Farcaster
        </button>
      </div>
    );
  }

  return null;
}