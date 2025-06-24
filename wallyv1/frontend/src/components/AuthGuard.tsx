'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionContext } from '@/context/SessionContext';
import { sdk } from '@farcaster/frame-sdk';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { loading, isValid, user } = useSessionContext();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [lastRedirect, setLastRedirect] = useState(0);
    const [isMiniApp, setIsMiniApp] = useState(false);

    // Detect Mini App environment
    useEffect(() => {
        const detectMiniApp = async () => {
            try {
                const isInMiniApp = await sdk.isInMiniApp();
                setIsMiniApp(isInMiniApp);
            } catch (error) {
                setIsMiniApp(false);
            }
        };

        detectMiniApp();
    }, []);

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/settings', '/dashboarduserinfo'];

    // Public routes that don't require authentication
    const publicRoutes = ['/auth', '/health', '/terms', '/disclaimer', '/instructions', '/feedback', '/result'];

    // Mini App specific routes (only accessible in Mini App)
    const miniAppOnlyRoutes = ['/splashpage'];

    useEffect(() => {
        // Wait for session and Mini App detection to load
        if (loading) return;

        // Prevent rapid redirects
        const now = Date.now();
        if (now - lastRedirect < 2000) return;

        setIsChecking(false);

        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
        const isMiniAppOnlyRoute = miniAppOnlyRoutes.some(route => pathname.startsWith(route));

        // Handle Mini App only routes
        if (isMiniAppOnlyRoute && !isMiniApp) {
            console.log('AuthGuard: Redirecting from Mini App only route to auth');
            setLastRedirect(now);
            router.replace('/auth');
            return;
        }

        // If on a protected route and not authenticated
        if (isProtectedRoute && !isValid) {
            console.log('AuthGuard: Redirecting to auth - protected route without authentication');
            setLastRedirect(now);
            router.replace('/auth');
            return;
        }

        // Root redirect logic
        if (pathname === '/') {
            if (isMiniApp) {
                // In Mini App, show splash page first
                console.log('AuthGuard: Mini App detected, redirecting to splash page');
                setLastRedirect(now);
                router.replace('/splashpage');
            } else if (isValid && user) {
                console.log('AuthGuard: Redirecting to dashboard - authenticated user on root');
                setLastRedirect(now);
                router.replace('/dashboard');
            } else {
                console.log('AuthGuard: Redirecting to auth - unauthenticated user on root');
                setLastRedirect(now);
                router.replace('/auth');
            }
            return;
        }

    }, [loading, isValid, user, pathname, router, lastRedirect, isMiniApp]);

    // Show loading during initial check or session loading
    if (loading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundImage: "url('/opengraph-image.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                <div className="absolute inset-0 bg-black/50"></div>
                <div className="relative z-10 text-center bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl max-w-md mx-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
