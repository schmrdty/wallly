import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface BillPaymentRule {
    id: string;
    userAddress: string;
    recipient: string;
    amount: string;
    tokenAddress: string;
    frequency: 'monthly' | 'weekly' | 'custom';
    isActive: boolean;
    createdAt: number;
    lastPaid?: number;
}

interface BillPaymentContextType {
    rules: BillPaymentRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<BillPaymentRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<BillPaymentRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const BillPaymentContext = createContext<BillPaymentContextType | null>(null);

export const useBillPayment = () => {
    const context = useContext(BillPaymentContext);
    if (!context) {
        throw new Error('useBillPayment must be used within a BillPaymentProvider');
    }
    return context;
};

export const BillPaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<BillPaymentRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/billPayment/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch bill payment rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<BillPaymentRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/billPayment/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create bill payment rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<BillPaymentRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/billPayment/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update bill payment rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/billPayment/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete bill payment rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BillPaymentContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </BillPaymentContext.Provider>
    );
};
