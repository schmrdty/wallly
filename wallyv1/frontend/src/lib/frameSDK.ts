/**
 * Mock Frame SDK for development when @farcaster/frame-sdk is not available
 * This provides basic functionality for Farcaster Mini App detection and actions
 */

interface FrameSDK {
    isInMiniApp(): Promise<boolean>;
    actions: {
        ready(): Promise<void>;
        close(): Promise<void>;
        signIn(params: { nonce: string; acceptAuthAddress?: boolean }): Promise<{ signature: string; message: string }>;
    };
    wallet: {
        getEthereumProvider(): Promise<any>;
    };
    haptics: {
        impactOccurred(type: 'light' | 'medium' | 'heavy'): Promise<void>;
        notificationOccurred(type: 'success' | 'warning' | 'error'): Promise<void>;
        selectionChanged(): Promise<void>;
    };
    experimental: {
        quickAuth(): Promise<{ token: string }>;
    };
}

class MockFrameSDK implements FrameSDK {
    private isMiniAppContext: boolean | null = null;

    async isInMiniApp(): Promise<boolean> {
        if (this.isMiniAppContext !== null) {
            return this.isMiniAppContext;
        }

        // Check if we're in a Frame context
        if (typeof window === 'undefined') return false;

        // Check for iframe
        const isIframe = window !== window.parent;

        // Check for React Native WebView
        const isReactNative = !!(window as any).ReactNativeWebView;

        // Check for Farcaster-specific context
        const isFarcaster = window.location.href.includes('farcaster') ||
            window.location.search.includes('miniApp=true') ||
            window.location.pathname.includes('/mini');

        this.isMiniAppContext = isIframe || isReactNative || isFarcaster;

        console.log('Frame SDK Mock: isInMiniApp =', this.isMiniAppContext);
        return this.isMiniAppContext;
    }

    actions = {
        async ready(): Promise<void> {
            console.log('Frame SDK Mock: ready() called');
            // Remove any loading spinners or splash screens
            const splash = document.querySelector('[data-splash]');
            if (splash) {
                splash.remove();
            }
        },

        async close(): Promise<void> {
            console.log('Frame SDK Mock: close() called');
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'close' }, '*');
            }
        }, async signIn(params: { nonce: string; acceptAuthAddress?: boolean }): Promise<{ signature: string; message: string }> {
            console.log('Frame SDK Mock: signIn() called with', params);
            // This would normally prompt Farcaster auth
            throw new Error('Frame SDK Mock: Real Farcaster auth not available in mock');
        }
    };

    wallet = {
        async getEthereumProvider(): Promise<any> {
            console.log('Frame SDK Mock: getEthereumProvider() called');
            // In a real Farcaster context, this would return the user's wallet provider
            if ((window as any).ethereum) {
                return (window as any).ethereum;
            }
            throw new Error('No Ethereum provider available');
        }
    };

    haptics = {
        async impactOccurred(type: 'light' | 'medium' | 'heavy'): Promise<void> {
            console.log('Frame SDK Mock: haptic impact', type);
            // In a real implementation, this would trigger device haptics
        },

        async notificationOccurred(type: 'success' | 'warning' | 'error'): Promise<void> {
            console.log('Frame SDK Mock: haptic notification', type);
        },

        async selectionChanged(): Promise<void> {
            console.log('Frame SDK Mock: haptic selection changed');
        }
    };

    experimental = {
        async quickAuth(): Promise<{ token: string }> {
            console.log('Frame SDK Mock: quickAuth() called');
            // This would normally return a real JWT from Farcaster's auth server
            throw new Error('Frame SDK Mock: QuickAuth not available in mock');
        }
    };
}

// Create singleton instance
export const sdk = new MockFrameSDK();

// Default export for compatibility
export default { sdk };
