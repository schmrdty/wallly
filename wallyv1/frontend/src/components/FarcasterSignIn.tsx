import React, { useState } from 'react';
import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { useAuth } from '../hooks/useAuth';

const appClient = createAppClient({
  relay: "https://relay.farcaster.xyz",
  ethereum: viemConnector(),
});

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'wally.schmidtiest.xyz';
const SIWE_URI = process.env.NEXT_PUBLIC_SIWE_URI || `https://${DOMAIN}/login`;

export const FarcasterSignIn: React.FC<{ onSuccess?: (user: any) => void; onError?: (error: any) => void }> = ({ onSuccess, onError }) => {
  const [channel, setChannel] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { signInWithFarcaster } = useAuth();

  const startSignIn = async () => {
    setStatus('pending');
    setError(null);
    try {
      // 1. Create a relay channel and get the SIWE URI and QR code
      const { data: channelData, isError, error: channelError } = await appClient.createChannel({
        siweUri: SIWE_URI,
        domain: DOMAIN,
      });
      if (isError) throw channelError;
      setChannel(channelData);

      // 2. Poll for status
      const { data: statusData, isError: statusError, error: statusErrObj } = await appClient.watchStatus({
        channelToken: channelData.channelToken,
        timeout: 120_000, // 2 minutes
        interval: 2_000,
      });
      if (statusError) throw statusErrObj;

      // 3. Verify the SIWE message and signature
      if (!statusData.signature) throw new Error('Missing signature in statusData');
      const { data: verifyData, success, isError: verifyError, error: verifyErrObj } = await appClient.verifySignInMessage({
        nonce: statusData.nonce,
        domain: DOMAIN,
        message: statusData.message ?? (() => { throw new Error('Missing message in statusData'); })(),
        signature: statusData.signature,
      });
      if (!success || verifyError) throw verifyErrObj;

      // 4. Extract user info and call onSuccess
      setStatus('completed');
      const user = {
        fid: statusData.fid,
        username: statusData.username,
        pfpUrl: statusData.pfpUrl,
        ...verifyData,
      };
      signInWithFarcaster(user);
      if (onSuccess) onSuccess(user);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Sign-in failed');
      if (onError) onError(err);
    }
  };

  return (
    <div>
      <button onClick={startSignIn} disabled={status === 'pending'}>
        {status === 'pending' ? 'Waiting for Farcaster...' : 'Sign In with Farcaster'}
      </button>
      {channel?.url && (
        <div>
          <p>Scan this QR code with your Farcaster wallet app:</p>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(channel.url)}&size=200x200`} alt="Farcaster QR" />
        </div>
      )}
      {status === 'error' && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};