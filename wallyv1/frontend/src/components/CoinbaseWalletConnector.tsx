import React from 'react';
import { useConnect } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

const CoinbaseWalletConnector: React.FC = () => {
    const { connect, connectors, status, variables } = useConnect();
    // Find the coinbase connector by name only
    const coinbase = connectors.find(
        (c) => c.name && c.name.toLowerCase().includes('coinbase')
    );

    // Use name for pending state
    const isConnecting =
        status === 'pending' &&
        variables?.connector?.name &&
        variables.connector.name.toLowerCase().includes('coinbase');

    return (
        <button
            className="pondWater-btn bg-black text-white px-8 py-4 rounded-lg text-xl font-semibold shadow-lg transition-all duration-150 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
            style={{
                color: '#fff',
                backgroundColor: '#000',
                fontSize: '1.25rem', // 20px
                fontWeight: 600,
                letterSpacing: '0.01em',
                textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                filter: 'brightness(1.1)',
            }}
            onClick={() => coinbase && connect({ connector: coinbase })}
            disabled={status === 'pending'}
            aria-label="Connect with Coinbase Wallet"
        >
            {isConnecting ? 'Connecting...' : 'Connect with Coinbase Wallet'}
        </button>
    );
};

export default CoinbaseWalletConnector;
