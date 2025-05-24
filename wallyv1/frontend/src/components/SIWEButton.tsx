import React from 'react';

export interface SIWEButtonProps {
  onSuccess: (user: any) => void;
}

const SIWEButton: React.FC<SIWEButtonProps> = ({ onSuccess }) => {
  const handleSignIn = async () => {
    try {
      const res = await fetch('/api/siwe/start', { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to start SIWE flow');
        return;
      }
      const { message, signature } = await res.json();
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      if (verifyRes.ok) {
        const user = await verifyRes.json();
        onSuccess(user);
      } else console.error('Failed to verify SIWE signature');
    } catch (error) {
      console.error('Error:', error);
    }
  };
  return <button onClick={handleSignIn}>Sign In With Ethereum</button>;
};
export default SIWEButton;
