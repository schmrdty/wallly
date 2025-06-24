// Separate configurations for Optimism and Base
import { createConfig, http } from 'wagmi';
import { optimism, base } from 'wagmi/chains';

// Initial configuration for Optimism
// Optimism config is for Farcaster AuthKit and sign-in only
export const optimismConfig = createConfig({
    chains: [optimism],
    transports: {
        [optimism.id]: http(),
    },
});

// Configuration for Optimism and Base
// Base config is for app contract actions after authentication
export const baseConfig = createConfig({
    chains: [optimism, base],
    transports: {
        [optimism.id]: http(),
        [base.id]: http(),
    },
});

// Export the initial configuration
export default optimismConfig;
