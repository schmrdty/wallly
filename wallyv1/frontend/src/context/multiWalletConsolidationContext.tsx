import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface MultiWalletConsolidationRule {
    id: string;
    userAddress: string;
    primaryWallet: string;
    sourceWallets: string[];
    tokenAddresses: string[];
    threshold: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
    isActive: boolean;
    createdAt: number;
    lastConsolidated?: number;
}

interface MultiWalletConsolidationContextType {
    rules: MultiWalletConsolidationRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<MultiWalletConsolidationRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<MultiWalletConsolidationRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const MultiWalletConsolidationContext = createContext<MultiWalletConsolidationContextType | null>(null);

export const useMultiWalletConsolidation = () => {
    const context = useContext(MultiWalletConsolidationContext);
    if (!context) {
        throw new Error('useMultiWalletConsolidation must be used within a MultiWalletConsolidationProvider');
    }
    return context;
};

export const MultiWalletConsolidationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<MultiWalletConsolidationRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/multiWalletConsolidation/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch multi-wallet consolidation rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<MultiWalletConsolidationRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/multiWalletConsolidation/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create multi-wallet consolidation rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<MultiWalletConsolidationRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/multiWalletConsolidation/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update multi-wallet consolidation rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/multiWalletConsolidation/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete multi-wallet consolidation rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MultiWalletConsolidationContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </MultiWalletConsolidationContext.Provider>
    );
};
