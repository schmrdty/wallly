import React, { useEffect, useState } from 'react';
import { useSession } from '../hooks/useSession';

const SessionManager: React.FC = () => {
    const { session, validateSession, revokeSession } = useSession();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const isValid = await validateSession();
                if (!isValid) {
                    setError('Session is invalid or expired. Please log in again.');
                }
            } catch (err) {
                setError('Error validating session. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [validateSession]);

    const handleRevokeSession = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await revokeSession();
            setSuccess('Session revoked.');
        } catch (err) {
            setError('Error revoking session. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2>Session Management</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            {session ? (
                <div>
                    <p>Session is active. User: {session.user}</p>
                    <button onClick={handleRevokeSession} disabled={loading}>
                        {loading ? 'Revoking...' : 'Revoke Session'}
                    </button>
                </div>
            ) : (
                <p>No active session. Please log in.</p>
            )}
        </div>
    );
};

export default SessionManager;