'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { config, networks, projectId, wagmiAdapter } from '@/config';
import { base } from '@reown/appkit/networks';

const queryClient = new QueryClient();

const metadata = {
  name: 'Wally the Wallet Watcher',
  description: 'AppKit Example',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://wally.schmidtiest.xyz',
  icons: ['https://wally.schmidtiest.xyz/logo.png'],
};

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks, // This is your array: [mainnet, arbitrum, base, degen, optimism]
    defaultNetwork: base, // This is fine, as base is in your array
    metadata,
    features: { analytics: true },
  });
}

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(config as Config, cookies);

  return WagmiProvider({
    config: config as Config,
    initialState,
    children: (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}
