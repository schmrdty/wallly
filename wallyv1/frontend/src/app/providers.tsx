'use client';

import '@farcaster/auth-kit/styles.css';
import React, { ReactNode, useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { config } from '@/config';
import { initializeAppKit } from '../lib/appkit';
import { FarcasterFrameProvider } from '../context/FarcasterFrameContext';
import { SessionProvider } from '../context/SessionContext';
import { WalletProvider } from '../context/WalletContext';
import { AutoSaveProvider } from '../context/autoSaveContext';
import { SubscriptionProvider } from '../context/subscriptionManagementContext';
import { ZeroOutOldWalletProvider } from '../context/zeroOutOldWalletContext';
import { BillPaymentProvider } from '../context/billPaymentContext';
import { CharityDonationProvider } from '../context/charityDonationContext';
import { EmergencyFundProvider } from '../context/emergencyFundContext';
import { InvestmentDCAProvider } from '../context/investmentDCAContext';
import { MultiWalletConsolidationProvider } from '../context/multiWalletConsolidationContext';

// Setup QueryClient
const queryClient = new QueryClient();

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    const [isMounted, setIsMounted] = useState(false); useEffect(() => {
        const init = async () => {
            setIsMounted(true);
            // Initialize AppKit after mount to prevent SSR issues
            if (typeof window !== 'undefined') {
                await initializeAppKit();
            }
        };
        init();
    }, []);

    if (!isMounted) {
        return null; // Prevent hydration mismatches
    } return (
        <FarcasterFrameProvider>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>                    <AuthKitProvider
                    config={{
                        domain: 'localhost:3000',
                        siweUri: 'http://localhost:3000/auth',
                        rpcUrl: process.env.NEXT_PUBLIC_OP_RPC_URL!,
                    }}
                >
                    <SessionProvider>
                        <WalletProvider>
                            <AutoSaveProvider>
                                <SubscriptionProvider>
                                    <ZeroOutOldWalletProvider>
                                        <BillPaymentProvider>
                                            <CharityDonationProvider>
                                                <EmergencyFundProvider>
                                                    <InvestmentDCAProvider>
                                                        <MultiWalletConsolidationProvider>
                                                            {children}
                                                        </MultiWalletConsolidationProvider>
                                                    </InvestmentDCAProvider>
                                                </EmergencyFundProvider>
                                            </CharityDonationProvider>
                                        </BillPaymentProvider>
                                    </ZeroOutOldWalletProvider>
                                </SubscriptionProvider>
                            </AutoSaveProvider>
                        </WalletProvider>
                    </SessionProvider>
                </AuthKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </FarcasterFrameProvider>
    );
}

// Named export for layout.tsx compatibility
export { Providers };