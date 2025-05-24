import React from 'react';
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthStatus } from './AuthStatus';

const Auth: React.FC = () => {
    const {
        loading,
        error,
        handleSignIn,
        nonceLoaded
    } = useAuthForm();

    return (
        <div className="auth-container">
            <h2>Sign in with Ethereum</h2>
            <button onClick={handleSignIn} disabled={loading || !nonceLoaded}>
                {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <AuthStatus error={error} />
        </div>
    );
};

export default Auth;
