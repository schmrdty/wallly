import React from 'react';

interface AuthStatusProps {
    error?: string | null;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ error }) =>
    error ? <p style={{ color: 'red' }}>{error}</p> : null;
