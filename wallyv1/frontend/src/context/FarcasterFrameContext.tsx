'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Try to import the real SDK, fall back to mock if not available
let sdk: any;
try {
    sdk = require('@farcaster/frame-sdk').sdk;
} catch (error) {
    console.warn('Real @farcaster/frame-sdk not available, using mock');
    sdk = require('../lib/frameSDK').sdk;
}

interface FarcasterFrameContextType {
    isInFrame: boolean;
    isSDKLoaded: boolean;
    frameContext: any;
    user: any;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    error: string | null;
}

const FarcasterFrameContext = createContext<FarcasterFrameContextType | null>(null);

export const useFarcasterFrame = () => {
    const context = useContext(FarcasterFrameContext);
    if (!context) {
        throw new Error('useFarcasterFrame must be used within a FarcasterFrameProvider');
    }
    return context;
};

interface FarcasterFrameProviderProps {
    children: ReactNode;
}

export const FarcasterFrameProvider = ({ children }: FarcasterFrameProviderProps) => {
    const [isInFrame, setIsInFrame] = useState(false);
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);
    const [frameContext, setFrameContext] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const initializeFrameSDK = async () => {
            try {
                // Check if we're in a Farcaster Frame/Mini App
                const inFrame = await sdk.isInMiniApp();
                setIsInFrame(inFrame);

                if (inFrame) {
                    // Ready the frame (hide splash screen)
                    await sdk.actions.ready();
                    console.log('🚀 Farcaster Frame SDK initialized and ready');
                } else {
                    console.log('📱 Not in Farcaster Frame, using fallback auth');
                }

                setIsSDKLoaded(true);
            } catch (err: any) {
                console.error('❌ Failed to initialize Farcaster Frame SDK:', err);
                setError(err.message || 'Failed to initialize Frame SDK');
                setIsSDKLoaded(true); // Still mark as loaded to prevent infinite loading
            }
        };

        initializeFrameSDK();
    }, []);
    const signIn = async () => {
        try {
            setError(null);

            if (isInFrame) {
                // Use Frame SDK sign in - need to provide nonce
                const nonce = Date.now().toString(); // Simple nonce for now
                const result = await sdk.actions.signIn({
                    nonce,
                    acceptAuthAddress: true
                });

                console.log('🎯 Farcaster Frame Sign In Success:', result);
                setUser(result);
                setIsAuthenticated(true);
            } else {
                // Fallback for non-frame environment
                console.log('🔄 Using fallback auth method outside frame');
                throw new Error('Not in Farcaster Frame - use AuthKit fallback');
            }
        } catch (err: any) {
            console.error('❌ Farcaster Frame sign in failed:', err);
            setError(err.message || 'Sign in failed');
            throw err; // Re-throw to allow fallback handling
        }
    };

    return (
        <FarcasterFrameContext.Provider
            value={{
                isInFrame,
                isSDKLoaded,
                frameContext,
                user,
                isAuthenticated,
                signIn,
                error,
            }}
        >
            {children}
        </FarcasterFrameContext.Provider>
    );
};

export default FarcasterFrameProvider;
