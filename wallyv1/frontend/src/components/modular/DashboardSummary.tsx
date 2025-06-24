'use client';

import React, { useState } from 'react';

interface DashboardSummaryProps {
    className?: string;
    currentUser: any;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
    className = '',
    currentUser
}) => {
    const [activeView, setActiveView] = useState<'overview' | 'quick-actions'>('overview');

    if (!currentUser) {
        return null;
    }

    return (
        <div className={`bg-white/10 backdrop-blur-md rounded-lg p-6 ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">🏠 Dashboard</h2>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                >
                    Full Dashboard
                </button>
            </div>

            {/* User Welcome */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                    {currentUser.pfpUrl && (
                        <img
                            src={currentUser.pfpUrl}
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-purple-400"
                        />
                    )}
                    <div>
                        <h3 className="text-white font-medium">Welcome back, {currentUser.displayName || currentUser.username}!</h3>
                        <p className="text-sm text-gray-400">FID: {currentUser.fid}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-white/10 rounded-lg p-1">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'quick-actions', label: 'Quick Actions' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveView(tab.key as any)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === tab.key
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeView === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Wallet Status</h4>
                        <p className="text-green-400">✅ Connected</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {currentUser.custody ? `${currentUser.custody.slice(0, 6)}...${currentUser.custody.slice(-4)}` : 'No wallet'}
                        </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Session</h4>
                        <p className="text-green-400">✅ Active</p>
                        <p className="text-xs text-gray-400 mt-1">Farcaster Auth</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Verifications</h4>
                        <p className="text-purple-400">{currentUser.verifications?.length || 0} linked</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2">Permissions</h4>
                        <p className="text-blue-400">View & Manage</p>
                    </div>
                </div>
            )}

            {activeView === 'quick-actions' && (
                <div className="space-y-3">
                    <button className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg transition-colors text-left">
                        <div className="flex justify-between items-center">
                            <span>💸 Send Transfer</span>
                            <span className="text-xs">Quick send ETH/tokens</span>
                        </div>
                    </button>

                    <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 px-4 py-3 rounded-lg transition-colors text-left">
                        <div className="flex justify-between items-center">
                            <span>🔐 Manage Permissions</span>
                            <span className="text-xs">Grant/revoke access</span>
                        </div>
                    </button>

                    <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 px-4 py-3 rounded-lg transition-colors text-left">
                        <div className="flex justify-between items-center">
                            <span>📜 View Contracts</span>
                            <span className="text-xs">Smart contract calls</span>
                        </div>
                    </button>

                    <button className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 text-orange-300 px-4 py-3 rounded-lg transition-colors text-left">
                        <div className="flex justify-between items-center">
                            <span>🗂️ Session History</span>
                            <span className="text-xs">View past activity</span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};
