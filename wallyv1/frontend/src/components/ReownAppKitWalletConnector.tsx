import React from 'react';
import { useConnect } from 'wagmi';
import { wagmiAdapter } from '@/config';

const ReownAppKitWalletConnector: React.FC = () => {
  const { connect, connectors, status, variables } = useConnect();
  // Use the first available AppKit connector by name
  const appkit = connectors.find((c) => c.name && c.name.toLowerCase().includes('appkit')) || connectors[0];

  // Use name for pending state
  const isConnecting =
    status === 'pending' &&
    variables?.connector?.name &&
    variables.connector.name.toLowerCase().includes('appkit');

  return (
    <button
      className="pondWater-btn bg-purple-600 text-white px-4 py-2 rounded"
      onClick={() => appkit && connect({ connector: appkit })}
      disabled={status === 'pending'}
      aria-label="Connect with reOwn AppKit Wallet"
    >
      {isConnecting ? 'Connecting...' : 'Connect with reOwn AppKit Wallet'}
    </button>
  );
};

export default ReownAppKitWalletConnector;
