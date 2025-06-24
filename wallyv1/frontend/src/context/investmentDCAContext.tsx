import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface InvestmentDCARule {
    id: string;
    userAddress: string;
    amount: string;
    tokenAddress: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
    createdAt: number;
    lastInvested?: number;
}

interface InvestmentDCAContextType {
    rules: InvestmentDCARule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<InvestmentDCARule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<InvestmentDCARule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const InvestmentDCAContext = createContext<InvestmentDCAContextType | null>(null);

export const useInvestmentDCA = () => {
    const context = useContext(InvestmentDCAContext);
    if (!context) {
        throw new Error('useInvestmentDCA must be used within an InvestmentDCAProvider');
    }
    return context;
};

export const InvestmentDCAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<InvestmentDCARule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/investmentDCA/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch investment DCA rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<InvestmentDCARule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/investmentDCA/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create investment DCA rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<InvestmentDCARule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/investmentDCA/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update investment DCA rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/investmentDCA/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete investment DCA rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <InvestmentDCAContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </InvestmentDCAContext.Provider>
    );
};
