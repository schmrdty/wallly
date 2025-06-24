'use client';

import React, { useState } from 'react';

interface ResultDisplayProps {
    className?: string;
    showForSignedInOnly?: boolean;
    currentUser?: any;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
    className = '',
    showForSignedInOnly = false,
    currentUser
}) => {
    const [activeTab, setActiveTab] = useState<'recent' | 'history' | 'errors'>('recent');

    // Don't show if this is for signed-in users only and user isn't signed in
    if (showForSignedInOnly && !currentUser) {
        return null;
    }

    const recentResults = [
        { id: 1, type: 'transfer', status: 'success', amount: '0.1 ETH', timestamp: '2 min ago' },
        { id: 2, type: 'permission', status: 'pending', action: 'Grant access', timestamp: '5 min ago' },
        { id: 3, type: 'auth', status: 'success', action: 'Farcaster Sign-In', timestamp: '10 min ago' },
    ];

    const errorResults = [
        { id: 1, type: 'error', message: 'Network timeout', timestamp: '1 hour ago' },
        { id: 2, type: 'warning', message: 'Redis connection lost', timestamp: '2 hours ago' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-400';
            case 'pending': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            case 'warning': return 'text-orange-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅';
            case 'pending': return '⏳';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '📋';
        }
    };

    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-lg p-6 ${className}`}>
            <h2 className="text-xl font-semibold text-white mb-4">📊 Activity Results</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-white/10 rounded-lg p-1">
                {[
                    { key: 'recent', label: 'Recent', count: recentResults.length },
                    { key: 'history', label: 'History', count: 0 },
                    { key: 'errors', label: 'Errors', count: errorResults.length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`pondWater-btn flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border-2 border-yellow-400 shadow-[0_0_16px_2px_rgba(255,255,0,0.3)] backdrop-blur-md ${activeTab === tab.key
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                        style={{ borderRadius: '10px', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600, textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)' }}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-3">
                {activeTab === 'recent' && (
                    <>
                        {recentResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                                    <div>
                                        <p className="text-white font-medium capitalize">{result.type}</p>
                                        <p className="text-sm text-gray-400">
                                            {result.amount || result.action}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                                        {result.status}
                                    </p>
                                    <p className="text-xs text-gray-400">{result.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No transaction history available</p>
                        {!currentUser && (
                            <p className="text-sm text-gray-500 mt-2">Sign in to view your history</p>
                        )}
                    </div>
                )}

                {activeTab === 'errors' && (
                    <>
                        {errorResults.map(result => (
                            <div key={result.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{getStatusIcon(result.type)}</span>
                                    <div>
                                        <p className="text-white font-medium capitalize">{result.type}</p>
                                        <p className="text-sm text-gray-400">{result.message}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">{result.timestamp}</p>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
