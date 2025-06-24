import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { WalletConnectionBanner } from './WalletConnectionBanner';
import { AutoSaveModule } from './modules/AutoSaveModule.tsx';
import { SubscriptionManagementModule } from './modules/SubscriptionManagementModule.tsx';
import BillPaymentModule from './modules/BillPaymentModule.tsx';
import EmergencyFundModule from './modules/EmergencyFundModule.tsx';
import InvestmentDCAModule from './modules/InvestmentDCAModule.tsx';
import CharityDonationModule from './modules/CharityDonationModule.tsx';
import MultiWalletConsolidationModule from './modules/MultiWalletConsolidationModule.tsx';
import ZeroOutOldWalletModule from './modules/ZeroOutOldWalletModule.tsx';

interface SchedulerInterfaceProps {
    className?: string;
}

const automationModules = [
    {
        id: 'auto-save',
        title: 'Auto Save',
        description: 'Automatically save excess funds when your balance exceeds a threshold',
        icon: '💰',
        component: AutoSaveModule,
        available: true
    },
    {
        id: 'subscriptions',
        title: 'Subscriptions',
        description: 'Manage recurring payments for services and subscriptions',
        icon: '🔄',
        component: SubscriptionManagementModule,
        available: true
    },
    {
        id: 'bill-pay',
        title: 'Bill Payments',
        description: 'Automate recurring bill payments',
        icon: '📄',
        component: BillPaymentModule,
        available: true
    },
    {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: 'Build emergency reserves automatically',
        icon: '🚨',
        component: EmergencyFundModule,
        available: true
    },
    {
        id: 'dca-investment',
        title: 'DCA Investment',
        description: 'Dollar-cost average into investments',
        icon: '📈',
        component: InvestmentDCAModule,
        available: true
    },
    {
        id: 'charity-donations',
        title: 'Charity Donations',
        description: 'Schedule charitable contributions',
        icon: '❤️',
        component: CharityDonationModule,
        available: true
    },
    {
        id: 'wallet-consolidation',
        title: 'Wallet Consolidation',
        description: 'Consolidate multiple wallets',
        icon: '🔄',
        component: MultiWalletConsolidationModule,
        available: true
    },
    {
        id: 'zero-out-wallet',
        title: 'Zero Out Wallet',
        description: 'Clear out old wallet balances',
        icon: '🧹',
        component: ZeroOutOldWalletModule,
        available: true
    }
];

export const SchedulerInterface: React.FC<SchedulerInterfaceProps> = ({ className = '' }) => {
    const { isAuthenticated, canUseAutomation, isWalletConnected } = useWallet();
    const [activeModule, setActiveModule] = useState<string | null>(null);

    const openModule = (moduleId: string) => {
        setActiveModule(moduleId);
    };

    const closeModule = () => {
        setActiveModule(null);
    }; if (!isAuthenticated) {
        return (
            <div className={`p-6 text-center ${className}`}>
                <div className="text-gray-500 mb-4">
                    Please sign in with Farcaster to access automation features
                </div>
            </div>
        );
    } return (
        <div className={`p-6 ${className}`}>
            {/* Wallet Connection Banner */}
            <WalletConnectionBanner />

            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 pondWater-font text-gray-800 dark:text-white">
                    Automation Scheduler
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Set up automated actions for your wallet
                </p>
                {!canUseAutomation && isWalletConnected && (
                    <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ Wallet connection required for full automation features
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {automationModules.map((module) => (
                    <div
                        key={module.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-between ${!canUseAutomation ? 'opacity-75' : ''}`}
                    >
                        <div>
                            <div className="text-4xl mb-4">{module.icon}</div>
                            <h3 className="text-xl font-semibold mb-2 pondWater-font text-gray-800 dark:text-white">
                                {module.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                {module.description}
                            </p>
                        </div>
                        <button
                            className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded pondWater-font transition-colors ${(!module.available || !canUseAutomation) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => (module.available && canUseAutomation) ? openModule(module.id) : null}
                            disabled={!module.available || !canUseAutomation}
                            title={!canUseAutomation ? 'Connect wallet to enable automation features' : ''}
                        >
                            {!canUseAutomation ? 'Wallet Required' : (module.available ? 'Configure' : 'Coming Soon')}
                        </button>
                    </div>
                ))}
            </div>

            {/* Render active module */}
            {activeModule && (() => {
                const module = automationModules.find(m => m.id === activeModule);
                if (!module) return null;
                const Component = module.component;
                return <Component open={true} onClose={closeModule} />;
            })()}
        </div>
    );
};

export default SchedulerInterface;
