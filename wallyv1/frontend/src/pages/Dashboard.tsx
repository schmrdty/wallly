import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { useEvents } from '../hooks/useEvents';
import TransferForm from '../components/TransferForm';
import EventFeed from '../hooks/EventFeed';
import SessionManager from '../hooks/SessionManager';
import TokenValidator from '../components/TokenValidator';
import ExportData from '../hooks/ExportData';
import { formatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { session, validateSession } = useSession();
    const { events } = useEvents();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const isValid = await validateSession();
                if (!isValid) {
                    setError('Session expired or invalid. Please log in again.');
                    setTimeout(() => navigate('/'), 2000);
                }
            } catch (err: any) {
                setError('Error validating session.');
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, [validateSession, navigate]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <h1>Welcome to Your Dashboard, {user?.name}</h1>
            <p>
                Session started:{" "}
                {session && session.createdAt
                    ? formatDate(session.createdAt)
                    : "Unknown"}
            </p>
            <SessionManager />
            <TokenValidator />
            <TransferForm />
            <EventFeed events={events} />
            <ExportData />
        </div>
    );
};

export default Dashboard;