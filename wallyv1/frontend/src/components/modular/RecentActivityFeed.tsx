'use client';

import React, { useEffect, useState } from 'react';
import { useEvents } from '@/hooks/useEvents';

interface EventData {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    source: 'backend' | 'frontend';
}

interface RecentActivityFeedProps {
    userId?: string;
    showForSignedInOnly?: boolean;
    currentUser?: any;
    maxEvents?: number;
    compact?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
    userId,
    showForSignedInOnly = false,
    currentUser,
    maxEvents = 5,
    compact = false
}) => {
    const { events, subscribeToEvents, loading: eventsLoading } = useEvents();
    const [displayEvents, setDisplayEvents] = useState<EventData[]>([]);

    // Show/hide logic
    const shouldShow = !showForSignedInOnly || (showForSignedInOnly && currentUser);

    useEffect(() => {
        if (shouldShow) {
            subscribeToEvents();
        }
    }, [subscribeToEvents, shouldShow]); useEffect(() => {
        // Convert events to our format and limit to maxEvents
        const formattedEvents = events.slice(0, maxEvents).map((event, index) => ({
            id: `event-${index}`,
            type: event.type || 'Activity',
            // Use event.message, fallback to generic if missing
            message: event.message || 'Activity recorded',
            timestamp: new Date(event.timestamp || Date.now()),
            source: event.source || 'backend'
        }));
        setDisplayEvents(formattedEvents);
    }, [events, maxEvents]);

    if (!shouldShow) {
        return null;
    }

    if (eventsLoading) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">📊 Recent Activity</h2>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                    <div className="h-4 bg-white/20 rounded w-2/3"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6" style={{ fontFamily: 'SF Pro Display' }}>
            {/* RecentActivityFeed: Shows recent on-chain and backend events. Follows pondWater UI style. */}
            <h2 className="text-xl font-semibold text-white mb-4" style={{ textShadow: '0px 4px 10px rgba(0,0,0,0.3)' }}>
                📊 Recent Activity
                {currentUser && (
                    <span className="text-sm font-normal text-gray-300 ml-2">
                        @{currentUser.farcasterUser?.username || currentUser.farcasterUser?.fid || currentUser.address || 'User'}
                    </span>
                )}
            </h2>
            {displayEvents.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No recent activity</p>
                    <p className="text-gray-500 text-xs mt-1">
                        Activity will appear here once you start using Wally
                    </p>
                </div>
            ) : (
                <div className="space-y-3 border border-white/20 rounded-lg bg-black/10 max-h-48 overflow-y-auto pr-2" style={{ minHeight: '3rem' }}>
                    {displayEvents.map((event) => (
                        <div
                            key={event.id}
                            className="flex items-start justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                        {event.type}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${event.source === 'backend'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-green-500/20 text-green-300'
                                        }`}>
                                        {event.source}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm">{event.message}</p>
                            </div>
                            <div className="text-xs text-gray-400 ml-3 text-right">
                                <div>{event.timestamp.toLocaleDateString()}</div>
                                <div>{event.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</div>
                            </div>
                        </div>
                    ))}
                    {/* Show more button if not compact and more events exist */}
                    {!compact && events.length > maxEvents && (
                        <div className="text-center pt-2">
                            <button className="text-purple-400 hover:text-purple-300 text-sm" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(15px)', boxShadow: '0px 4px 10px rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                View more activity →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
