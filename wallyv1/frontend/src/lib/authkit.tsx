'use client';

import React from 'react';
import { AuthKitProvider } from '@farcaster/auth-kit';

const authConfig = {
    rpcUrl: 'https://mainnet.optimism.io',
    domain: process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000',
    siweUri: process.env.NEXT_PUBLIC_APP_URI || 'http://localhost:3000',
};

export function FarcasterAuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthKitProvider config={authConfig}>
            {children}
        </AuthKitProvider>
    );
}
