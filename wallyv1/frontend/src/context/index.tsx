'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi';
import { config, projectId } from '../config/index';
import { ClientOnly } from '../components/ClientOnly';
import { initializeAppKit } from '../lib/appkit';
import { AutoSaveProvider } from './autoSaveContext';
import { SubscriptionProvider } from './subscriptionManagementContext';
import { ZeroOutOldWalletProvider } from './zeroOutOldWalletContext.tsx';
import { BillPaymentProvider } from './billPaymentContext.tsx';
import { CharityDonationProvider } from './charityDonationContext.tsx';
import { EmergencyFundProvider } from './emergencyFundContext.tsx';
import { InvestmentDCAProvider } from './investmentDCAContext.tsx';
import { MultiWalletConsolidationProvider } from './multiWalletConsolidationContext.tsx';

const queryClient = new QueryClient();

export function ContextProvider({
    children,
    cookies,
}: {
    children: any;
    cookies: string | null;
}) {
    const [appKitReady, setAppKitReady] = useState(false);
    const initialState = cookieToInitialState(config as Config, cookies);

    useEffect(() => {
        // Initialize AppKit only on the client side
        if (projectId && typeof window !== 'undefined' && !appKitReady) {
            const appKit = initializeAppKit();
            if (appKit) {
                setAppKitReady(true);
            }
        }
    }, [appKitReady]);

    return (
        <WagmiProvider config={config as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                <AutoSaveProvider>
                    <SubscriptionProvider>
                        <ZeroOutOldWalletProvider>
                            <BillPaymentProvider>
                                <CharityDonationProvider>
                                    <EmergencyFundProvider>
                                        <InvestmentDCAProvider>
                                            <MultiWalletConsolidationProvider>
                                                <ClientOnly fallback={<div>Loading...</div>}>
                                                    {children}
                                                </ClientOnly>
                                            </MultiWalletConsolidationProvider>
                                        </InvestmentDCAProvider>
                                    </EmergencyFundProvider>
                                </CharityDonationProvider>
                            </BillPaymentProvider>
                        </ZeroOutOldWalletProvider>
                    </SubscriptionProvider>
                </AutoSaveProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

// Export as default as well for backward compatibility
export default ContextProvider;
