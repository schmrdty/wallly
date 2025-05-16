import { useEffect, useState } from 'react';
import { getSession, validateSession as apiValidateSession, revokeSession as apiRevokeSession } from '../utils/api';

const useSession = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionData = await getSession();
                setSession(sessionData);
            } catch (err) {
                setSession(null);
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchSession();
    }, []);

    const isValid = !!session && !error && !loading;

    // Graceful session expiration
    useEffect(() => {
        if (!isValid && !loading) {
            // Optionally: redirect to /auth or show modal
        }
    }, [isValid, loading]);

    // Add validateSession and revokeSession for use in components
    const validateSession = async () => {
        try {
            return await apiValidateSession();
        } catch {
            return false;
        }
    };

    const revokeSession = async () => {
        try {
            await apiRevokeSession();
            setSession(null);
        } catch (err) {
            // handle error
        }
    };

    return { session, loading, error, isValid, validateSession, revokeSession };
};

export default useSession;