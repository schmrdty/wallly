import React from 'react';
import { SignInButton, useSignIn } from '@farcaster/auth-kit';
import { useAuth } from '../hooks/useAuth';

const Auth: React.FC = () => {
    const { setUser } = useAuth();
    const { signIn, isSigningIn, error } = useSignIn({
        onSuccess: (user) => {
            setUser(user); // Store Farcaster user object in your context/hook
        }
    });

    return (
        <div className="auth-container">
            <h2>Sign in with Farcaster</h2>
            <SignInButton onClick={signIn} loading={isSigningIn} />
            {error && <p style={{ color: 'red' }}>{error.message}</p>}
        </div>
    );
};

export default Auth;