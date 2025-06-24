'use client';

import React from 'react';
import { useSessionContext } from '@/context/SessionContext';
import ThemeToggle from '../ThemeToggle';
import { DashboardView } from './DashboardContainer';

interface DashboardHeaderProps {
    currentView: DashboardView;
    onMenuToggleAction: () => void; // Client-side interaction function
    isMiniApp: boolean;
}

const viewTitles: Record<DashboardView, string> = {
    overview: 'User Dashboard',
    transfers: 'Management',
    automation: 'Automation Scheduler',
    health: 'Health and Resources',
    events: 'Event Feed',
    settings: 'Settings'
};

export function DashboardHeader({ currentView, onMenuToggleAction, isMiniApp }: DashboardHeaderProps) {
    const { user } = useSessionContext();
    // Get display name from appropriate source based on auth provider
    const getDisplayName = () => {
        if (!user) return 'User';

        // For Farcaster users, check nested farcasterUser object
        if (user.farcasterUser) {
            return user.farcasterUser.displayName || user.farcasterUser.username || user.farcasterUser.custody || 'User';
        }

        // Fallback for other auth types (show address or generic)
        return user.address || user.displayName || 'User';
    };

    return (
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            {/* DashboardHeader: Top navigation bar for dashboard views. Follows pondWater UI style. */}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side - Menu button and title */}
                    <div className="flex items-center">
                        {/* Mobile menu button */}                        <button
                            onClick={onMenuToggleAction}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 pondWater-btn"
                            style={{ border: '2px solid #FFD600', boxShadow: '0 0 16px 2px #FFD60055', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600 }}
                            aria-label="Open sidebar menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Current view title */}
                        <h1 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">
                            {viewTitles[currentView]}
                        </h1>

                        {/* Mini App indicator */}
                        {isMiniApp && (
                            <span className="ml-3 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                Mini App
                            </span>
                        )}
                    </div>

                    {/* Right side - User info and controls */}
                    <div className="flex items-center space-x-4">
                        {/* User info */}                        {user && (
                            <div className="hidden sm:flex items-center space-x-3">
                                {user.farcasterUser?.pfpUrl && (
                                    <img
                                        src={user.farcasterUser.pfpUrl}
                                        alt={getDisplayName()}
                                        className="w-8 h-8 rounded-full"
                                    />
                                )}
                                <div className="text-sm">
                                    <div className="font-medium text-gray-700 dark:text-gray-200">
                                        {getDisplayName()}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                        FID: {user.farcasterUser?.fid || user.fid || user.address}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theme toggle */}
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
