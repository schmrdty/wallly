'use client';

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi';
import { createAppKit } from '@reown/appkit/react';
import { config, networks, projectId, wagmiAdapter } from '@/config';
import { base } from '@reown/appkit/networks';

const queryClient = new QueryClient();

const metadata = {
  name: 'Your App Name',
  description: 'Your App Description',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com',
  icons: ['https://yourdomain.com/icon.png'],
};

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    defaultNetwork: base,
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

  // Return WagmiProvider as a function call, wrapped in a fragment for ReactNode compatibility
  return (
    <>
      {WagmiProvider({
        config: config as Config,
        initialState,
        children: <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      })}
    </>
  );
}
