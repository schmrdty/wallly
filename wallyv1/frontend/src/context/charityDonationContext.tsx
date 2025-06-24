import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../utils/api';

export interface CharityDonationRule {
    id: string;
    userAddress: string;
    charity: string;
    amount: string;
    tokenAddress: string;
    frequency: 'monthly' | 'one-time';
    isActive: boolean;
    createdAt: number;
    lastDonated?: number;
}

interface CharityDonationContextType {
    rules: CharityDonationRule[];
    loading: boolean;
    error: string | null;
    createRule: (rule: Omit<CharityDonationRule, 'id' | 'createdAt'>) => Promise<void>;
    updateRule: (id: string, updates: Partial<CharityDonationRule>) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;
    refreshRules: () => Promise<void>;
}

const CharityDonationContext = createContext<CharityDonationContextType | null>(null);

export const useCharityDonation = () => {
    const context = useContext(CharityDonationContext);
    if (!context) {
        throw new Error('useCharityDonation must be used within a CharityDonationProvider');
    }
    return context;
};

export const CharityDonationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rules, setRules] = useState<CharityDonationRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/charityDonation/rules');
            setRules(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch charity donation rules');
        } finally {
            setLoading(false);
        }
    };

    const createRule = async (rule: Omit<CharityDonationRule, 'id' | 'createdAt'>) => {
        setLoading(true);
        setError(null);
        try {
            await api.post('/api/charityDonation/create', rule);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to create charity donation rule');
        } finally {
            setLoading(false);
        }
    };

    const updateRule = async (id: string, updates: Partial<CharityDonationRule>) => {
        setLoading(true);
        setError(null);
        try {
            await api.put(`/api/charityDonation/update/${id}`, updates);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to update charity donation rule');
        } finally {
            setLoading(false);
        }
    };

    const deleteRule = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/api/charityDonation/delete/${id}`);
            await refreshRules();
        } catch (err: any) {
            setError(err.message || 'Failed to delete charity donation rule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CharityDonationContext.Provider value={{ rules, loading, error, createRule, updateRule, deleteRule, refreshRules }}>
            {children}
        </CharityDonationContext.Provider>
    );
};
