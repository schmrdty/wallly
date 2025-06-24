'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/frame-sdk';
import { useSessionContext } from '@/context/SessionContext';

interface WalletConnectionManagerProps {
    children?: React.ReactElement;
    fallbackToEthereum?: boolean;
}

/**
 * WalletConnectionManager implements Farcaster-first authentication with Ethereum fallback
 * Following the branching logic specified in fc-appkit.mdc instructions
 */
export const WalletConnectionManager: React.FC<WalletConnectionManagerProps> = ({
    children,
    fallbackToEthereum = true
}) => {
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user, isValid } = useSessionContext();
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    // Detect Farcaster Mini App environment
    useEffect(() => {
        const detectMiniApp = async () => {
            try {
                const isInMiniApp = await sdk.isInMiniApp();
                setIsMiniApp(isInMiniApp);
                console.log('Mini App detection:', isInMiniApp);
            } catch (error) {
                console.warn('Not in Farcaster Mini App:', error);
                setIsMiniApp(false);
            } finally {
                setLoading(false);
            }
        };

        detectMiniApp();
    }, []);

    // Auto-connect in Mini App when Farcaster user has custody address
    useEffect(() => {
        if (isMiniApp && user?.farcasterUser?.custody && !isConnected) {
            console.log('Auto-connecting with Farcaster custody address:', user.farcasterUser.custody);
            // In Mini App, we don't need to manually connect - the custody address is already available
        }
    }, [isMiniApp, user, isConnected]);

    const getPrimaryAddress = () => {
        // Priority: Farcaster custody address > Connected wallet address
        return user?.farcasterUser?.custody || address;
    };

    const getConnectionStatus = () => {
        const primaryAddress = getPrimaryAddress();

        if (isMiniApp && user?.farcasterUser?.custody) {
            return {
                connected: true,
                address: user.farcasterUser.custody,
                source: 'farcaster',
                displayName: user.farcasterUser.displayName || user.farcasterUser.username
            };
        }

        if (isConnected && address) {
            return {
                connected: true,
                address,
                source: 'ethereum',
                displayName: `${address.slice(0, 6)}...${address.slice(-4)}`
            };
        }

        return {
            connected: false,
            address: null,
            source: null,
            displayName: null
        };
    };

    const handleConnect = async () => {
        if (isMiniApp) {
            // In Mini App, connection is handled by Farcaster client
            console.log('In Mini App - connection handled by Farcaster client');
            return;
        }

        if (fallbackToEthereum && connectors.length > 0) {
            try {
                // Use the first available connector (typically injected wallet)
                await connect({ connector: connectors[0] });
            } catch (error) {
                console.error('Failed to connect wallet:', error);
            }
        }
    };

    const handleDisconnect = async () => {
        if (isMiniApp) {
            // In Mini App, we can't disconnect from Farcaster
            console.log('Cannot disconnect in Mini App');
            return;
        }

        if (isConnected) {
            await disconnect();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                <span className="ml-2 text-sm text-gray-600">Detecting environment...</span>
            </div>
        );
    }

    const connectionStatus = getConnectionStatus();

    return (
        <div className="wallet-connection-manager">
            {/* Connection Status Display */}
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                            {connectionStatus.connected ? 'Connected' : 'Not Connected'}
                        </h3>
                        {connectionStatus.connected && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p>Source: {connectionStatus.source === 'farcaster' ? 'Farcaster Mini App' : 'Ethereum Wallet'}</p>
                                <p>Address: {connectionStatus.address}</p>
                                {connectionStatus.displayName && (
                                    <p>Name: {connectionStatus.displayName}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Connection Controls */}
                    <div className="flex gap-2">
                        {!connectionStatus.connected ? (
                            <button
                                onClick={handleConnect}
                                disabled={isMiniApp && !fallbackToEthereum}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isMiniApp ? 'Connect via Farcaster' : 'Connect Wallet'}
                            </button>
                        ) : (
                            connectionStatus.source === 'ethereum' && (
                                <button
                                    onClick={handleDisconnect}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Disconnect
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Environment Info */}
            <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Environment: {isMiniApp ? 'Farcaster Mini App' : 'Web Application'}</p>
                <p>Auth Status: {isValid ? 'Valid Session' : 'No Session'}</p>
                {user?.authProvider && <p>Auth Provider: {user.authProvider}</p>}
            </div>

            {/* Render children with connection context */}
            {children}

            {/* Connection Troubleshooting */}
            {!connectionStatus.connected && !isMiniApp && fallbackToEthereum && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Wallet Connection Tips
                    </h4>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        <li>• Make sure you have a wallet extension installed (MetaMask, Coinbase Wallet, etc.)</li>
                        <li>• Check that you're on the correct network</li>
                        <li>• Try refreshing the page if connection fails</li>
                        <li>• For optimal experience, use within Farcaster Mini App</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WalletConnectionManager;
