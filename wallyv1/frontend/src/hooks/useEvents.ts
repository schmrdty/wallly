import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import { api } from '@/utils/api.ts';
import { formatDate } from '@/utils/formatters.ts';
import { logger } from '@/utils/logger';

export type EventItem = {
    type: string;
    data: string;
    timestamp: string;
};

interface BackendEvent {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    userId?: string;
}

interface EventData {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    source: 'backend' | 'frontend';
}

// Minimal ABI for the events you're listening to
const WALLY_ABI = [
    "event MiniAppSessionGranted(address indexed user, bytes32 indexed sessionId)",
    "event MiniAppSessionRevoked(address indexed user, bytes32 indexed sessionId)",
    "event PermissionGranted(address indexed user, string permission)",
    "event PermissionRevoked(address indexed user, string permission)"
];

const useEvents = () => {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const contractRef = useRef<ethers.Contract | null>(null);
    const listenersRef = useRef<any[]>([]);

    const subscribeToEvents = useCallback(async () => {
        if (isSubscribed) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        // Clean up existing listeners first
        if (contractRef.current && listenersRef.current.length) {
            listenersRef.current.forEach(({ eventName, listener }) => {
                if (contractRef.current) {
                    contractRef.current.off(eventName, listener);
                }
            });
            listenersRef.current = [];
        }

        // On-chain events
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum as any);
                const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

                if (contractAddress) {
                    const contract = new ethers.Contract(
                        contractAddress,
                        WALLY_ABI,
                        provider
                    );
                    contractRef.current = contract;

                    // Listen for events
                    const eventNames = [
                        'MiniAppSessionGranted',
                        'MiniAppSessionRevoked',
                        'PermissionGranted',
                        'PermissionRevoked',
                    ];

                    eventNames.forEach(eventName => {
                        const listener = (...args: any[]) => {
                            if (!cancelled) {
                                setEvents(prev => [
                                    ...prev,
                                    {
                                        id: `frontend-${Date.now()}-${Math.random()}`,
                                        type: eventName,
                                        message: JSON.stringify(args.slice(0, -1)),
                                        timestamp: new Date(),
                                        source: 'frontend'
                                    }
                                ]);
                            }
                        };
                        contract.on(eventName, listener);
                        listenersRef.current.push({ eventName, listener });
                    });
                } else {
                    console.warn('NEXT_PUBLIC_CONTRACT_ADDRESS not configured');
                }
            } catch (error) {
                console.error('Failed to set up contract listeners:', error);
            }
        }

        // Backend events
        try {
            // Try to fetch backend events with timeout and fallback
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const response = await api.get('/api/events', {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!cancelled && response.data) {
                    const backendEvents = response.data.map((ev: BackendEvent) => ({
                        ...ev,
                        timestamp: new Date(ev.timestamp),
                        source: 'backend' as const
                    }));

                    setEvents(prev => [...prev, ...backendEvents]);
                }
            } catch (apiError: any) {
                // Don't break the app if backend is down
                logger.warn('Backend events unavailable, continuing with frontend-only events', apiError);
                setError('Backend events unavailable. Some features may be limited.');

                // Add a mock event to show the system is working
                const mockEvent: EventData = {
                    id: `frontend-${Date.now()}`,
                    type: 'system',
                    message: 'Frontend loaded successfully (backend offline)',
                    timestamp: new Date(),
                    source: 'frontend'
                };

                if (!cancelled) {
                    setEvents(prev => [...prev, mockEvent]);
                }
            }

        } catch (error: any) {
            if (!cancelled) {
                logger.error('Failed to subscribe to events', error);
                setError('Failed to initialize events system');
            }
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }

        return () => {
            cancelled = true;
            setIsSubscribed(false);
        };
    }, [isSubscribed]);

    const addEvent = useCallback((type: string, message: string) => {
        const event: EventData = {
            id: `frontend-${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: new Date(),
            source: 'frontend'
        };

        setEvents(prev => [...prev, event]);
        logger.info(`Event added: ${type} - ${message}`);
    }, []);

    const clearEvents = useCallback(() => {
        setEvents([]);
        logger.info('Events cleared');
    }, []);

    // Auto-subscribe on mount
    useEffect(() => {
        subscribeToEvents();

        // Cleanup on unmount
        return () => {
            setIsSubscribed(false);
        };
    }, [subscribeToEvents]);

    return {
        events,
        loading,
        error,
        isSubscribed,
        subscribeToEvents,
        addEvent,
        clearEvents
    };
};

export { useEvents };
export default useEvents;