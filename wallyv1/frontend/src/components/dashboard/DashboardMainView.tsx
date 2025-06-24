'use client';

import React, { useState } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { useAccount } from 'wagmi';
import { WalletConnectionManager } from '../WalletConnectionManager';
import ContractDashboard from '../ContractDashboard';
import UserInfo from '../UserInfo';
import AutoSaveModule from '../modules/AutoSaveModule';
import SubscriptionManagementModule from '../modules/SubscriptionManagementModule';
import BillPaymentModule from '../modules/BillPaymentModule';
import InvestmentDCAModule from '../modules/InvestmentDCAModule';
import EmergencyFundModule from '../modules/EmergencyFundModule';
import CharityDonationModule from '../modules/CharityDonationModule';
import MultiWalletConsolidationModule from '../modules/MultiWalletConsolidationModule';
import ZeroOutOldWalletModule from '../modules/ZeroOutOldWalletModule';

export const DashboardMainView: React.FC<{ openModule: string | null, onCloseModuleAction: () => void }> = ({ openModule, onCloseModuleAction }) => {
    const { user } = useSessionContext();
    const { address, isConnected } = useAccount();

    return (
        <div className="dashboard-main-view">
            {/* Main Dashboard Content */}
            <div className="p-6">
                {/* User Info Section */}
                <div className="mb-6">
                    <UserInfo />
                </div>
                {/* Wallet Connection Section */}
                <div className="mb-6">
                    <WalletConnectionManager>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h3 className="text-lg font-semibold mb-2">Wallet Status</h3>
                            {isConnected ? (
                                <div className="text-green-400">
                                    ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-yellow-400">
                                        ⚠️ Please connect your wallet to use automation features
                                    </div>
                                    <appkit-button />
                                </div>
                            )}
                        </div>
                    </WalletConnectionManager>
                </div>

                {/* Contract Dashboard */}
                {isConnected && (
                    <div className="mb-6">
                        <ContractDashboard />
                    </div>
                )}
            </div>

            {/* Modules */}
            <AutoSaveModule open={openModule === 'autoSave'} onClose={onCloseModuleAction} />
            <SubscriptionManagementModule open={openModule === 'subscriptionManagement'} onClose={onCloseModuleAction} />
            <BillPaymentModule open={openModule === 'billPayment'} onClose={onCloseModuleAction} />
            <InvestmentDCAModule open={openModule === 'investmentDCA'} onClose={onCloseModuleAction} />
            <EmergencyFundModule open={openModule === 'emergencyFund'} onClose={onCloseModuleAction} />
            <CharityDonationModule open={openModule === 'charityDonation'} onClose={onCloseModuleAction} />
            <MultiWalletConsolidationModule open={openModule === 'multiWalletConsolidation'} onClose={onCloseModuleAction} />
            <ZeroOutOldWalletModule open={openModule === 'zeroOutOldWallet'} onClose={onCloseModuleAction} />
        </div>
    );
};

export default DashboardMainView;
