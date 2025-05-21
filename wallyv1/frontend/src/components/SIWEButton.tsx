import React from 'react';
import PropTypes from 'prop-types';

const SIWEButton = ({ onSuccess }) => {
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
      if (verifyRes.ok) onSuccess();
      else console.error('Failed to verify SIWE signature');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <button onClick={handleSignIn}>Sign In With Ethereum</button>;
};

SIWEButton.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default SIWEButton;