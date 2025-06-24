// SSR-compatible storage implementation
export const createSSRStorage = (): Storage => ({
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    key: () => null,
    length: 0,
});

// Get storage with SSR fallback
export const getStorage = (): Storage | undefined => {
    if (typeof window !== 'undefined') {
        return undefined; // Use default storage in browser
    }
    return createSSRStorage(); // Use mock storage during SSR
};

export default { createSSRStorage, getStorage };
