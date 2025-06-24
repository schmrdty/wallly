import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface ZeroOutOldWalletRule {
    id: string;
    userAddress: string;
    sourceWallet: string;
    targetWallet: string;
    includeNFTs: boolean;
    includeTokens: boolean;
    includeNative: boolean;
    minTokenValueUSD: string;
    isActive: boolean;
    createdAt: number;
    lastExecuted?: number;
}

interface ZeroOutOldWalletContextType {
    rules: ZeroOutOldWalletRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<ZeroOutOldWalletRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<ZeroOutOldWalletRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const ZeroOutOldWalletContext = createContext<ZeroOutOldWalletContextType | null>(null);

export const useZeroOutOldWallet = () => {
    const context = useContext(ZeroOutOldWalletContext);
    if (!context) {
        throw new Error('useZeroOutOldWallet must be used within a ZeroOutOldWalletProvider');
    }
    return context;
};

export const ZeroOutOldWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<ZeroOutOldWalletRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/zeroOut/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch zero-out rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<ZeroOutOldWalletRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/zeroOut/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create zero-out rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<ZeroOutOldWalletRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/zeroOut/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update zero-out rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/zeroOut/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete zero-out rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ZeroOutOldWalletContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </ZeroOutOldWalletContext.Provider>
    );
};
