import React, { useEffect, useState } from 'react';
import { useEvents } from '../hooks/useEvents';

const EventFeed: React.FC = () => {
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
        <div>
            <h2>Event Feed</h2>
            <ul>
                {events.map((event, index) => (
                    <li key={index}>
                        <strong>{event.type}</strong>: {event.data} at {new Date(event.timestamp).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default EventFeed;