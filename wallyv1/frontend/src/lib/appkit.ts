'use client';

import { createAppKit } from '@reown/appkit/react';
import { config, networks, projectId, wagmiAdapter } from '@/config';
import { base } from '@reown/appkit/networks';

const metadata = {
    name: 'Wally the Wallet Watcher',
    description: 'Automated non-custodial wallet monitoring and transfers',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://wally.schmidtiest.xyz',
    icons: ['https://wally.schmidtiest.xyz/icon.png'],
};

let appKitInstance: any = null;

export const initializeAppKit = () => {
    if (typeof window === 'undefined' || appKitInstance) {
        return appKitInstance;
    } try {
        // Skip AppKit initialization if using dummy project ID
        const isDummyProject = projectId === 'development-dummy-id-12345678' || projectId === 'dev-fallback-12345678';

        if (isDummyProject && process.env.NODE_ENV === 'development') {
            // Silently skip in development to reduce noise
            return null;
        }

        if (!projectId) {
            console.warn('⚠️ No project ID provided. Wallet connection will be limited.');
            return null;
        }

        appKitInstance = createAppKit({
            adapters: [wagmiAdapter],
            projectId: projectId!,
            networks,
            defaultNetwork: base,
            metadata,
            features: { analytics: false }, // Disable analytics to reduce errors
        });

        console.log('AppKit initialized successfully');
        return appKitInstance;
    } catch (error) {
        console.warn('AppKit initialization failed:', error);
        return null;
    }
};

export const getAppKit = () => appKitInstance;
