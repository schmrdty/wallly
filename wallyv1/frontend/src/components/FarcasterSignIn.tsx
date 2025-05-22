import React from 'react';
import { useSignIn, QRCode } from '@farcaster/auth-kit';
import { api } from '../utils/api';

export const FarcasterSignIn: React.FC<{ onError?: (error: any) => void }> = (props) => {
  const {
    signIn,
    url,
    data: { message, signature, fid, username, pfpUrl } = {},
    isSuccess,
    error,
  } = useSignIn({
    onSuccess: async ({ fid, message, signature }) => {
      await api.post('/api/auth/login', {
        message,
        signature,
        fid,
        username,
        pfpUrl,
      })
        .then((response) => {
          // Handle successful login
          console.log('Login successful:', response.data);
          // setUser({ address: response.data.address, fid }); // Uncomment if setUser is in scope
        })
        .catch((error) => {
          // Handle error
          console.error('Login error:', error);
          alert('Login failed. Please try again.');
          if (props.onError) props.onError(error);
        });
    },
  });

  return (
    <div>
      <button onClick={signIn}>Sign In with Farcaster</button>
      {url && <QRCode uri={url} />}
      {isSuccess && <div>Welcome, {username}!</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
};