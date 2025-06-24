import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useContractIntegration } from '../hooks/useContractIntegration.ts';
import { useTransactionManager } from '../hooks/useTransactionManager.ts';
import { useEventMonitoring } from '../hooks/useEventMonitoring.ts';
import type {
    ContractState,
    UserContractData
} from '../hooks/useContractIntegration.ts';
import type {
    TransactionRequest,
    ContractEvent,
    EventStats
} from '../types/contracts.ts';

interface ContractContextValue {
    // Contract integration
    contractState: ContractState | null;
    userData: UserContractData | null;
    loading: boolean;
    error: string | null;
    isHealthy: boolean;
    realTimeEnabled: boolean;

    // Transaction management
    transactions: TransactionRequest[];
    hasActiveTransactions: boolean;
    pendingCount: number;
    processingCount: number;

    // Event monitoring
    recentEvents: ContractEvent[];
    eventStats: EventStats | null;
    criticalEventCount: number;

    // Actions
    refreshData: () => Promise<void>;
    enableRealTime: () => void;
    disableRealTime: () => void;
    clearCompletedTransactions: () => void;
}

const ContractContext = createContext<ContractContextValue | undefined>(undefined);

interface ContractProviderProps {
    children: ReactNode;
    autoStartRealTime?: boolean;
    autoStartEventMonitoring?: boolean;
}

export function ContractProvider({
    children,
    autoStartRealTime = true,
    autoStartEventMonitoring = true
}: ContractProviderProps) {
    const { isConnected } = useAccount();

    // Integration hooks
    const contractIntegration = useContractIntegration();
    const transactionManager = useTransactionManager();
    const eventMonitoring = useEventMonitoring();

    // Global loading state
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // Auto-start real-time features when connected
    useEffect(() => {
        if (isConnected) {
            if (autoStartRealTime && !contractIntegration.realTimeEnabled) {
                contractIntegration.enableRealTimeUpdates();
            }

            if (autoStartEventMonitoring && !eventMonitoring.isMonitoring) {
                eventMonitoring.startMonitoring();
            }
        }
    }, [
        isConnected,
        autoStartRealTime,
        autoStartEventMonitoring,
        contractIntegration.realTimeEnabled,
        contractIntegration.enableRealTimeUpdates,
        eventMonitoring.isMonitoring,
        eventMonitoring.startMonitoring
    ]);

    // Aggregate loading states
    useEffect(() => {
        const loading = contractIntegration.loading ||
            transactionManager.loading ||
            eventMonitoring.loading ||
            globalLoading;

        // Update global loading with debounce to prevent flickering
        const timer = setTimeout(() => {
            setGlobalLoading(loading);
        }, 100);

        return () => clearTimeout(timer);
    }, [
        contractIntegration.loading,
        transactionManager.loading,
        eventMonitoring.loading,
        globalLoading
    ]);

    // Aggregate error states
    useEffect(() => {
        const errors = [
            contractIntegration.error,
            transactionManager.error,
            eventMonitoring.error,
            globalError
        ].filter(Boolean);

        setGlobalError(errors.length > 0 ? errors[0] : null);
    }, [
        contractIntegration.error,
        transactionManager.error,
        eventMonitoring.error,
        globalError
    ]);

    // Global refresh function
    const refreshData = async () => {
        setGlobalLoading(true);
        setGlobalError(null);

        try {
            await Promise.all([
                contractIntegration.refreshData(),
                eventMonitoring.fetchEvents()
            ]);
        } catch (err: any) {
            setGlobalError(err.message || 'Failed to refresh data');
        } finally {
            setGlobalLoading(false);
        }
    };

    // Real-time control functions
    const enableRealTime = () => {
        contractIntegration.enableRealTimeUpdates();
        eventMonitoring.startMonitoring();
    };

    const disableRealTime = () => {
        contractIntegration.disableRealTimeUpdates();
        eventMonitoring.stopMonitoring();
    };

    // Clear completed transactions
    const clearCompletedTransactions = () => {
        transactionManager.clearTransactions(['completed', 'failed', 'cancelled']);
    };

    // Computed values
    const pendingCount = transactionManager.pendingTransactions.length;
    const processingCount = transactionManager.processingTransactions.length;
    const hasActiveTransactions = pendingCount + processingCount > 0;
    const criticalEventCount = eventMonitoring.criticalEvents.length;
    const recentEvents = eventMonitoring.recentEvents;

    const contextValue: ContractContextValue = {
        contractState: contractIntegration.contractState,
        userData: contractIntegration.userData,
        loading: globalLoading,
        error: globalError,
        isHealthy: contractIntegration.isHealthy,
        realTimeEnabled: contractIntegration.realTimeEnabled,

        // Transaction management
        transactions: transactionManager.transactions,
        hasActiveTransactions,
        pendingCount,
        processingCount,

        // Event monitoring
        recentEvents,
        eventStats: eventMonitoring.stats,
        criticalEventCount,

        // Actions
        refreshData,
        enableRealTime,
        disableRealTime,
        clearCompletedTransactions
    };

    return (
        <ContractContext.Provider value={contextValue}>
            {children}
        </ContractContext.Provider>
    );
}

// Hook to use the contract context
export function useContract() {
    const context = useContext(ContractContext);
    if (context === undefined) {
        throw new Error('useContract must be used within a ContractProvider');
    }
    return context;
}

// HOC for components that need contract data
export function withContract<P extends object>(
    Component: React.ComponentType<P>
): React.ComponentType<P> {
    return function WrappedComponent(props: P) {
        return (
            <ContractProvider>
                <Component {...props} />
            </ContractProvider>
        );
    };
}

// Selector hooks for specific data
export function useContractState() {
    const { contractState, loading, error } = useContract();
    return { contractState, loading, error };
}

export function useUserData() {
    const { userData, loading, error } = useContract();
    return { userData, loading, error };
}

export function useTransactionStatus() {
    const {
        transactions,
        hasActiveTransactions,
        pendingCount,
        processingCount
    } = useContract();
    return {
        transactions,
        hasActiveTransactions,
        pendingCount,
        processingCount
    };
}

export function useEventStatus() {
    const { recentEvents, eventStats, criticalEventCount } = useContract();
    return { recentEvents, eventStats, criticalEventCount };
}

export default ContractContext;
