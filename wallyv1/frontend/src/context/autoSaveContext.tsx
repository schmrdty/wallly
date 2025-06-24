import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface AutoSaveRule {
    id: string;
    userAddress: string;
    triggerAmount: string;
    savingsPercentage: number;
    destinationAddress: string;
    tokenAddress: string;
    isActive: boolean;
    createdAt: number;
    lastTriggered?: number;
}

interface AutoSaveContextType {
    rules: AutoSaveRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<AutoSaveRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<AutoSaveRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const AutoSaveContext = createContext<AutoSaveContextType | null>(null);

export const useAutoSave = () => {
    const context = useContext(AutoSaveContext);
    if (!context) {
        throw new Error('useAutoSave must be used within an AutoSaveProvider');
    }
    return context;
};

export const AutoSaveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<AutoSaveRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/autoSave/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch auto-save rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<AutoSaveRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/api/autoSave/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create auto-save rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<AutoSaveRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/autoSave/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update auto-save rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/autoSave/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete auto-save rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AutoSaveContext.Provider
            value={{
                rules,
                loading,
                error,
                createRule,
                updateRule,
                deleteRule,
                refreshRules
            }}
        >
            {children}
        </AutoSaveContext.Provider>
    );
};

export { AutoSaveContext };
