import { useState, useEffect, useCallback, useRef } from 'react';
import { contractClient } from '../utils/contractClient.ts';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

export interface ContractEvent {
    id: string;
    type: string;
    category: 'permission' | 'session' | 'transfer' | 'transaction' | 'admin' | 'system';
    severity: 'info' | 'warning' | 'error' | 'critical';
    user?: Address;
    data: any;
    blockNumber: bigint;
    transactionHash: string;
    timestamp: number;
    processed: boolean;
}

export interface EventFilter {
    categories?: ContractEvent['category'][];
    types?: string[];
    users?: Address[];
    severities?: ContractEvent['severity'][];
    fromBlock?: bigint;
    toBlock?: bigint;
    fromTimestamp?: number;
    toTimestamp?: number;
}

export interface EventStats {
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number; // Last 24 hours
    errorRate: number;
}

export function useEventMonitoring(active: boolean = false) {
    const { address, isConnected } = useAccount();
    const [events, setEvents] = useState<ContractEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<ContractEvent[]>([]);
    const [filter, setFilter] = useState<EventFilter>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [stats, setStats] = useState<EventStats | null>(null);
    const [errorCount, setErrorCount] = useState(0);

    // Real-time monitoring
    const wsRef = useRef<WebSocket | null>(null);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch events with filter
    const fetchEvents = useCallback(async (eventFilter?: EventFilter, limit = 100) => {
        try {
            setLoading(true);
            setError(null);
            const response = await contractClient.getEvents({
                filter: eventFilter || filter,
                limit,
                offset: 0
            });
            setErrorCount(0); // Reset error count on success

            const processedEvents: ContractEvent[] = response.events.map(event => ({
                id: `${event.transactionHash}_${event.logIndex}`,
                type: event.type,
                category: categorizeEvent(event.type),
                severity: getSeverity(event.type, event.data),
                user: event.user,
                data: event.data,
                blockNumber: BigInt(event.blockNumber),
                transactionHash: event.transactionHash,
                timestamp: event.timestamp,
                processed: false
            }));

            setEvents(processedEvents);
            updateStats(processedEvents);
            return processedEvents;
        } catch (err: any) {
            setError(err.message || 'Failed to fetch events');
            if (err.message && err.message.includes('404')) {
                setErrorCount((prev) => prev + 1);
            }
            return [];
        } finally {
            setLoading(false);
        }
    }, [filter]);

    // Update event statistics
    const updateStats = useCallback((eventList: ContractEvent[]) => {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;

        const stats: EventStats = {
            total: eventList.length,
            byCategory: {},
            byType: {},
            bySeverity: {},
            recentCount: 0,
            errorRate: 0
        };

        let errorCount = 0;

        eventList.forEach(event => {
            // Count by category
            stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;

            // Count by type
            stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

            // Count by severity
            stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;

            // Count recent events
            if (event.timestamp >= dayAgo) {
                stats.recentCount++;
            }

            // Count errors
            if (event.severity === 'error' || event.severity === 'critical') {
                errorCount++;
            }
        });

        stats.errorRate = eventList.length > 0 ? (errorCount / eventList.length) * 100 : 0;
        setStats(stats);
    }, []);

    // Categorize event by type
    const categorizeEvent = (eventType: string): ContractEvent['category'] => {
        if (eventType.includes('Permission')) return 'permission';
        if (eventType.includes('Session')) return 'session';
        if (eventType.includes('Transfer')) return 'transfer';
        if (eventType.includes('Transaction')) return 'transaction';
        if (eventType.includes('Admin') || eventType.includes('Role')) return 'admin';
        return 'system';
    };

    // Determine event severity
    const getSeverity = (eventType: string, data: any): ContractEvent['severity'] => {
        if (eventType.includes('Failed') || eventType.includes('Error')) return 'error';
        if (eventType.includes('Revoked') || eventType.includes('Cancelled')) return 'warning';
        if (eventType.includes('Emergency') || eventType.includes('Paused')) return 'critical';
        return 'info';
    };    // Clear all events
    const clearEvents = useCallback(() => {
        setEvents([]);
        setFilteredEvents([]);
        setStats(null);
    }, []);

    // Apply filter and update filtered events
    const applyFilter = useCallback((newFilter: EventFilter) => {
        setFilter(newFilter);

        const filtered = events.filter(event => {
            // Category filter
            if (newFilter.categories && newFilter.categories.length > 0) {
                if (!newFilter.categories.includes(event.category)) return false;
            }

            // Type filter
            if (newFilter.types && newFilter.types.length > 0) {
                if (!newFilter.types.includes(event.type)) return false;
            }

            // User filter
            if (newFilter.users && newFilter.users.length > 0) {
                if (!event.user || !newFilter.users.includes(event.user)) return false;
            }

            // Severity filter
            if (newFilter.severities && newFilter.severities.length > 0) {
                if (!newFilter.severities.includes(event.severity)) return false;
            }

            // Block range filter
            if (newFilter.fromBlock && event.blockNumber < newFilter.fromBlock) return false;
            if (newFilter.toBlock && event.blockNumber > newFilter.toBlock) return false;

            // Timestamp filter
            if (newFilter.fromTimestamp && event.timestamp < newFilter.fromTimestamp) return false;
            if (newFilter.toTimestamp && event.timestamp > newFilter.toTimestamp) return false;

            return true;
        });

        setFilteredEvents(filtered);
    }, [events]);

    // Start real-time monitoring
    const startMonitoring = useCallback(() => {
        if (isMonitoring) return;

        setIsMonitoring(true);

        // WebSocket connection for real-time events
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
            wsRef.current = new WebSocket(`${wsUrl}/events`);

            wsRef.current.onopen = () => {
                console.log('Event monitoring WebSocket connected');

                // Subscribe to relevant events
                const subscription = {
                    type: 'subscribe',
                    events: filter.types || ['*'],
                    users: filter.users || (address ? [address] : undefined)
                };

                wsRef.current?.send(JSON.stringify(subscription));
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'new_event') {
                        const newEvent: ContractEvent = {
                            id: `${data.event.transactionHash}_${data.event.logIndex}`,
                            type: data.event.type,
                            category: categorizeEvent(data.event.type),
                            severity: getSeverity(data.event.type, data.event.data),
                            user: data.event.user,
                            data: data.event.data,
                            blockNumber: BigInt(data.event.blockNumber),
                            transactionHash: data.event.transactionHash,
                            timestamp: data.event.timestamp,
                            processed: false
                        };

                        setEvents(prev => {
                            const updated = [newEvent, ...prev].slice(0, 1000); // Keep last 1000 events
                            updateStats(updated);
                            return updated;
                        });
                    }
                } catch (err) {
                    console.warn('Failed to parse WebSocket event:', err);
                }
            };

            wsRef.current.onerror = (err) => {
                console.warn('Event monitoring WebSocket error:', err);
                // Fallback to polling
            };

            wsRef.current.onclose = () => {
                console.log('Event monitoring WebSocket closed');
                if (isMonitoring) {
                    // Fallback to polling
                }
            };
        } catch (err) {
            console.warn('Failed to establish WebSocket connection:', err);
            // Fallback to polling
        }
    }, [isMonitoring, filter, address, updateStats, categorizeEvent, getSeverity]);

    // Polling logic
    useEffect(() => {
        if (!active) return;
        if (errorCount > 1) return; // Stop polling on repeated 404s
        pollingInterval.current = setInterval(() => {
            fetchEvents();
        }, 10000); // Poll every 10s
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [active, fetchEvents, errorCount]);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false);

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    }, []);

    // Mark events as processed
    const markEventsProcessed = useCallback((eventIds: string[]) => {
        setEvents(prev => prev.map(event =>
            eventIds.includes(event.id)
                ? { ...event, processed: true }
                : event
        ));
    }, []);

    // Get events by category
    const getEventsByCategory = useCallback((category: ContractEvent['category']) => {
        return filteredEvents.filter(event => event.category === category);
    }, [filteredEvents]);

    // Get events by severity
    const getEventsBySeverity = useCallback((severity: ContractEvent['severity']) => {
        return filteredEvents.filter(event => event.severity === severity);
    }, [filteredEvents]);

    // Get unprocessed events
    const getUnprocessedEvents = useCallback(() => {
        return filteredEvents.filter(event => !event.processed);
    }, [filteredEvents]);    // Auto-start monitoring when connected and apply filters when they change
    useEffect(() => {
        if (isConnected) {
            fetchEvents();
            startMonitoring();
        } else {
            stopMonitoring();
        }
        applyFilter(filter);
    }, [isConnected, fetchEvents, startMonitoring, stopMonitoring, filter, applyFilter]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    return {
        // State
        events: filteredEvents,
        allEvents: events,
        filteredEvents,
        loading,
        error,
        isMonitoring,
        filter,
        stats,

        // Actions
        fetchEvents,
        startMonitoring,
        stopMonitoring,
        applyFilter,
        clearEvents,
        setFilter,
        markEventsProcessed,

        // Query helpers
        getEventsByCategory,
        getEventsBySeverity,
        getUnprocessedEvents,

        // Computed properties
        unprocessedCount: getUnprocessedEvents().length,
        criticalEvents: getEventsBySeverity('critical'),
        errorEvents: getEventsBySeverity('error'),
        warningEvents: getEventsBySeverity('warning'),
        recentEvents: filteredEvents.filter(e =>
            e.timestamp >= Date.now() - 24 * 60 * 60 * 1000
        ),

        // Filter presets
        setUserFilter: (user: Address) => applyFilter({ ...filter, users: [user] }),
        setCategoryFilter: (categories: ContractEvent['category'][]) =>
            applyFilter({ ...filter, categories }),
        setSeverityFilter: (severities: ContractEvent['severity'][]) =>
            applyFilter({ ...filter, severities }),
        clearFilter: () => applyFilter({})
    };
}
