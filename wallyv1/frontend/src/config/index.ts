import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, base, degen, optimism } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined. Please set it in .env.local');
}

// Explicitly type as required by AppKit
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base, degen, optimism];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
