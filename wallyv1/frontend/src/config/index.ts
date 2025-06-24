import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
import { base, optimism } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
const opRpcUrl = process.env.NEXT_PUBLIC_OP_RPC_URL;
const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in your .env file');
}
if (!opRpcUrl) {
  throw new Error('NEXT_PUBLIC_OP_RPC_URL is not defined. Please set it in your .env file');
}
if (!baseRpcUrl) {
  throw new Error('NEXT_PUBLIC_BASE_RPC_URL is not defined. Please set it in your .env file. This is for your app\'s onchain actions, not Farcaster auth.');
}

// Create new network objects with the custom RPC URLs to ensure they are used.
const customOptimism: AppKitNetwork = {
  ...optimism,
  rpcUrls: {
    ...optimism.rpcUrls,
    default: { http: [opRpcUrl] },
    public: { http: [opRpcUrl] },
  }
};

const customBase: AppKitNetwork = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: { http: [baseRpcUrl] },
    public: { http: [baseRpcUrl] },
  }
};

// Only use Optimism for Farcaster AuthKit sign-in
export const farcasterNetworks: [AppKitNetwork] = [customOptimism];

export const farcasterWagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: projectId!,
  networks: farcasterNetworks,
  connectors: [
    farcasterFrame() // Farcaster Frame connector (Optimism only)
  ],
});

export const farcasterConfig = farcasterWagmiAdapter.wagmiConfig;

// Use both Optimism and Base for app contract actions after authentication
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [customOptimism, customBase];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: projectId!,
  networks,
  connectors: [
    farcasterFrame() // Add Farcaster Frame connector
  ],
});

export const config = wagmiAdapter.wagmiConfig;
