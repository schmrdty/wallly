import React, { useEffect, useState, useRef } from 'react';
import { EventItem, useEvents } from '../hooks/useEvents.ts';

interface EventData {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    source: 'backend' | 'frontend';
}

interface EventFeedProps {
    userId: string;
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function EventFeed({ userId }: EventFeedProps) {
    const { events, subscribeToEvents } = useEvents();
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const debouncedRefresh = useRef(debounce(async () => {
        setLoading(true);
        await subscribeToEvents();
        setLoading(false);
        setFetched(true);
    }, 1000));
    const handleRefresh = () => {
        debouncedRefresh.current();
    };

    return (
        <div className="border rounded bg-white/10 p-2 max-h-48 overflow-y-auto" style={{ minHeight: '7.5em' }}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-200">Events</span>
                <button className="pondWater-btn px-2 py-1 text-xs" onClick={handleRefresh} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>
            <ul className="space-y-2">
                {events.slice(0, 5).map((event: EventData, index: number) => (
                    <li key={event.id || index} className="p-2 bg-gray-50 rounded border text-xs">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <strong className="font-semibold text-gray-800">{event.type}</strong>
                                <p className="text-gray-600 mt-1">{event.message}</p>
                            </div>
                            <div className="text-xs text-gray-500 ml-2">
                                <div>{new Date(event.timestamp).toLocaleString()}</div>
                                <div className="mt-1">
                                    <span className={`inline-block px-2 py-1 rounded text-xs ${event.source === 'backend'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                        }`}>
                                        {event.source}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
                {events.length === 0 && fetched && (
                    <li className="text-gray-500 italic p-4 text-center">
                        No events to display
                    </li>
                )}
            </ul>
        </div>
    );
}

export default EventFeed;