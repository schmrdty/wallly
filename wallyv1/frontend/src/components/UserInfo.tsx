'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useProfile } from '@farcaster/auth-kit';
import { formatEther } from 'viem';
import { throttle } from '../utils/throttle';

interface UserInfoProps {
    className?: string;
}

function UserInfo({ className = '' }: UserInfoProps) {
    const { address, isConnected } = useAccount();
    const { isAuthenticated, profile } = useProfile();
    const [balance, setBalance] = useState<string>('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            fetchBalanceThrottled();
        }
    }, [isConnected, address]);

    const fetchBalance = async () => {
        if (!address) return;

        setLoading(true);
        try {
            // This would typically call your API to get balance
            const response = await fetch(`/api/wallet/balance?address=${address}`);
            if (response.ok) {
                const data = await response.json();
                setBalance(data.formatted || data.balance || '0');
            } else {
                console.warn('Balance API returned non-OK status:', response.status);
                setBalance('0');
            }
        } catch (error) {
            console.warn('Failed to fetch balance, defaulting to 0:', error);
            setBalance('0');
        } finally {
            setLoading(false);
        }
    };

    // Throttled version of fetchBalance
    const fetchBalanceThrottled = throttle(
        `balance-fetch-${address}`,
        fetchBalance,
        10000 // Throttle to max once every 10 seconds
    );

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                User Information
            </h2>

            {/* Farcaster Profile */}
            {isAuthenticated && profile && (
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                        Farcaster Profile
                    </h3>
                    <div className="space-y-2">                        <p className="text-sm">
                        <span className="font-medium">Username:</span> {profile.username || 'N/A'}
                    </p>
                        <p className="text-sm">
                            <span className="font-medium">FID:</span> {profile.fid || 'N/A'}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Connected Address:</span> {profile.custody || address || 'N/A'}
                        </p>
                    </div>
                </div>
            )}

            {/* Wallet Information */}
            {isConnected && address && (
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                        Wallet Information
                    </h3>
                    <div className="space-y-2">
                        <p className="text-sm break-all">
                            <span className="font-medium">Address:</span> {address}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Balance:</span>
                            {loading ? (
                                <span className="ml-2">Loading...</span>
                            ) : (
                                <span className="ml-2">{balance} ETH</span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            <div className="mb-4">
                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                    Connection Status
                </h3>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">Wallet: {isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm">Farcaster: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={fetchBalance}
                    disabled={!isConnected || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                    Refresh Balance
                </button>
            </div>
        </div>
    );
}

export default UserInfo;
