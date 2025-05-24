import React, { useEffect, useState } from 'react';
import { EventItem, useEvents } from '../hooks/useEvents';

interface EventFeedProps {
    userId: string;
}

const EventFeed: React.FC<EventFeedProps> = ({ userId }) => {
    const { events, subscribeToEvents } = useEvents();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            await subscribeToEvents();
            setLoading(false);
        };

        fetchEvents();

        return () => {
            // Cleanup subscription if necessary
        };
    }, [subscribeToEvents]);

    if (loading) {
        return <div>Loading events...</div>;
    }

    return (
        <ul>
            {events.map((event: EventItem, index: number) => (
                <li key={index}>
                    <strong>{event.type}</strong>: {event.data} at {new Date(event.timestamp).toLocaleString()}
                </li>
            ))}
        </ul>
    );
};

export default EventFeed;