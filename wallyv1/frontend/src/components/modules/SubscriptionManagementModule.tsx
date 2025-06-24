import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSubscription, SubscriptionRule } from '../../context/subscriptionManagementContext.tsx';

interface SubscriptionFormData {
    serviceName: string;
    recipientAddress: string;
    amount: string;
    tokenAddress: string;
    frequency: 'monthly' | 'yearly';
    dayOfMonth: number;
    monthOfYear?: number;
}

interface AutomationConfig {
    id: string;
    type: string;
    walletAddress: string;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, any>;
}

interface SubscriptionManagementModuleProps {
    open: boolean;
    onClose: () => void;
}

export const SubscriptionManagementModule: React.FC<SubscriptionManagementModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules: subscriptions, loading, error, createRule, updateRule, deleteRule, pauseRule, resumeRule, refreshRules } = useSubscription();
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<SubscriptionFormData>({
        serviceName: '',
        recipientAddress: '',
        amount: '',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        frequency: 'monthly',
        dayOfMonth: 1
    });

    useEffect(() => {
        if (address && open) {
            refreshRules();
        }
    }, [address, open, refreshRules]);

    const handleFrequencyChange = (frequency: 'monthly' | 'yearly') => {
        setFormData({
            ...formData,
            frequency,
            amount: formData.amount // Keep the amount as is, since we're removing specific services
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        try {
            const subscriptionRule = {
                userAddress: address,
                subscriptionName: formData.serviceName,
                recurringAmount: formData.amount,
                recipientAddress: formData.recipientAddress,
                tokenAddress: formData.tokenAddress,
                intervalDays: formData.frequency === 'monthly' ? 30 : 365,
                isActive: true,
                nextExecutionDate: calculateNextPaymentDate(formData.dayOfMonth, formData.frequency)
            };

            await createRule(subscriptionRule);
            setShowAddForm(false);
            resetForm();
        } catch (err: any) {
            console.error('Failed to create subscription:', err);
        }
    };

    const calculateNextPaymentDate = (day: number, frequency: 'monthly' | 'yearly'): number => {
        const date = new Date();
        date.setDate(day);
        if (date < new Date()) {
            if (frequency === 'monthly') {
                date.setMonth(date.getMonth() + 1);
            } else {
                date.setFullYear(date.getFullYear() + 1);
            }
        }
        return date.getTime();
    };

    const resetForm = () => {
        setFormData({
            serviceName: '',
            recipientAddress: '',
            amount: '',
            tokenAddress: '0x0000000000000000000000000000000000000000',
            frequency: 'monthly',
            dayOfMonth: 1
        });
    };

    const cancelSubscription = async (subscriptionId: string) => {
        try {
            await deleteRule(subscriptionId);
        } catch (err: any) {
            console.error('Failed to cancel subscription:', err);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
                <div className="header flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold pondWater-font">Subscription Manager</h2>
                    <button className="bg-yellow-400 text-white font-bold py-1 px-4 rounded pondWater-font hover:bg-yellow-500" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Cancel' : 'Add Subscription'}
                    </button>
                </div>
                {error && <div className="mb-4 text-red-600">{error}</div>}
                {showAddForm && (
                    <div className="add-subscription-form mb-6">
                        <h3 className="text-lg font-semibold mb-2 pondWater-font">Add New Subscription</h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block mb-1 font-semibold">Service Name</label>
                                <input
                                    type="text"
                                    value={formData.serviceName}
                                    onChange={e => setFormData({ ...formData, serviceName: e.target.value })}
                                    placeholder="Custom service name"
                                    required
                                    className="w-full p-2 rounded border border-gray-300 pondWater-font"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Recipient Address</label>
                                <input
                                    type="text"
                                    value={formData.recipientAddress}
                                    onChange={e => setFormData({ ...formData, recipientAddress: e.target.value })}
                                    placeholder="0x..."
                                    required
                                    className="w-full p-2 rounded border border-gray-300 pondWater-font"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Payment Frequency</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 rounded ${formData.frequency === 'monthly' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} pondWater-font`}
                                        onClick={() => handleFrequencyChange('monthly')}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex-1 py-2 rounded ${formData.frequency === 'yearly' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-700'} pondWater-font`}
                                        onClick={() => handleFrequencyChange('yearly')}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Amount (USDC)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    className="w-full p-2 rounded border border-gray-300 pondWater-font"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-semibold">Payment Day</label>
                                <select
                                    value={formData.dayOfMonth}
                                    onChange={e => setFormData({ ...formData, dayOfMonth: Number(e.target.value) })}
                                    className="w-full p-2 rounded border border-gray-300 pondWater-font"
                                >
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-yellow-400 text-white font-bold py-2 rounded pondWater-font hover:bg-yellow-500">
                                Add Subscription
                            </button>
                        </form>
                    </div>
                )}
                <div className="subscriptions-list mt-6">
                    <h3 className="text-lg font-semibold mb-2 pondWater-font">Active Subscriptions</h3>
                    {subscriptions.length === 0 && <div className="text-gray-500">No subscriptions found.</div>}
                    {subscriptions.map(sub => (<div key={sub.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded mb-2">
                        <div>
                            <div className="font-semibold">{sub.subscriptionName}</div>
                            <div className="text-xs text-gray-600">${sub.recurringAmount} every {sub.intervalDays} days</div>
                            <div className="text-xs text-gray-600">Next payment: {new Date(sub.nextExecutionDate).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-600">Status: {sub.isActive ? 'Active' : 'Paused'}</div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => sub.isActive ? pauseRule(sub.id) : resumeRule(sub.id)}
                                className={`px-3 py-1 rounded font-bold pondWater-font ${sub.isActive ? 'bg-orange-400' : 'bg-green-400'} text-white`}
                            >
                                {sub.isActive ? 'Pause' : 'Resume'}
                            </button>
                            <button
                                onClick={() => cancelSubscription(sub.id)}
                                className="px-3 py-1 rounded font-bold pondWater-font bg-red-400 text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionManagementModule;
