import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface SubscriptionRule {
    id: string;
    userAddress: string;
    subscriptionName: string;
    recurringAmount: string;
    recipientAddress: string;
    tokenAddress: string;
    intervalDays: number;
    isActive: boolean;
    nextExecutionDate: number;
    createdAt: number;
    lastExecuted?: number;
    executionCount: number;
}

interface SubscriptionContextType {
    rules: SubscriptionRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<SubscriptionRule, 'id' | 'createdAt' | 'executionCount'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<SubscriptionRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    pauseRule: (id: string) => Promise<void>;
    resumeRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<SubscriptionRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/subscription/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch subscription rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<SubscriptionRule, 'id' | 'createdAt' | 'executionCount'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/subscription/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create subscription rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<SubscriptionRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/subscription/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update subscription rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/subscription/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete subscription rule');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const pauseRule = async (id: string) => {
        await updateRule(id, { isActive: false });
    };

    const resumeRule = async (id: string) => {
        await updateRule(id, { isActive: true });
    };

    return (
        <SubscriptionContext.Provider
            value={{
                rules,
                loading,
                error,
                createRule,
                updateRule,
                deleteRule,
                pauseRule,
                resumeRule,
                refreshRules
            }}        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export { SubscriptionContext };
