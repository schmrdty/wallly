'use client';

import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useSessionContext } from '../context/SessionContext';

interface WalletConnectionBannerProps {
    className?: string;
}

export const WalletConnectionBanner: React.FC<WalletConnectionBannerProps> = ({ className = '' }) => {
    const {
        isAuthenticated,
        isWalletConnected,
        walletAddress,
        isConnecting,
        connectWallet,
        disconnectWallet,
        canUseAutomation
    } = useWallet();
    const { user } = useSessionContext();

    // Don't show banner if not authenticated with Farcaster
    if (!isAuthenticated) {
        return null;
    }

    // Don't show banner if wallet is already connected
    if (isWalletConnected && canUseAutomation) {
        return null;
    }

    const handleConnect = async () => {
        try {
            await connectWallet();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    };

    return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>                        <h3 className="text-sm font-medium text-blue-900">
                        Connect Your Farcaster Wallet
                    </h3>
                        <p className="text-sm text-blue-700">
                            {isWalletConnected
                                ? `Connected: ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                                : 'Connect your Farcaster wallet to enable automation features like Auto Save, Bill Pay, and more.'
                            }
                        </p>
                        {user?.custody && !isWalletConnected && (
                            <p className="text-xs text-blue-600 mt-1">
                                Available Farcaster wallet: {user.custody.slice(0, 6)}...{user.custody.slice(-4)}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    {!isWalletConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Farcaster Wallet'}
                        </button>
                    ) : (
                        <button
                            onClick={disconnectWallet}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletConnectionBanner;
