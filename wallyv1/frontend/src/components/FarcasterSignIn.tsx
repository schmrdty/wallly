import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../hooks/useAuth';

const SignInButton = dynamic(
  () => import('@farcaster/auth-kit').then(mod => mod.SignInButton),
  { ssr: false }
);

export const FarcasterSignIn: React.FC<{ onSuccess?: (user: any) => void; onError?: (error: any) => void }> = ({ onSuccess, onError }) => {
  const { signInWithFarcaster } = useAuth();
  console.log('Rendering FarcasterSignIn');
  return (
    <SignInButton
      onSuccess={({ fid, username, ...rest }) => {
        const user = { fid, username, ...rest };
        signInWithFarcaster(user);
        if (onSuccess) onSuccess(user);
      }}
      onError={onError}
    />
  );
};