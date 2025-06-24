import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface EmergencyFundRule {
    id: string;
    userAddress: string;
    minBalance: string;
    topUpAmount: string;
    tokenAddress: string;
    isActive: boolean;
    createdAt: number;
    lastToppedUp?: number;
}

interface EmergencyFundContextType {
    rules: EmergencyFundRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<EmergencyFundRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<EmergencyFundRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const EmergencyFundContext = createContext<EmergencyFundContextType | null>(null);

export const useEmergencyFund = () => {
    const context = useContext(EmergencyFundContext);
    if (!context) {
        throw new Error('useEmergencyFund must be used within an EmergencyFundProvider');
    }
    return context;
};

export const EmergencyFundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<EmergencyFundRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/emergencyFund/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch emergency fund rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<EmergencyFundRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/emergencyFund/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create emergency fund rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<EmergencyFundRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/emergencyFund/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update emergency fund rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/emergencyFund/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete emergency fund rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <EmergencyFundContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </EmergencyFundContext.Provider>
    );
};
