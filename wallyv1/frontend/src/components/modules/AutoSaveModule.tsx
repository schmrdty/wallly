import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAutoSave, AutoSaveRule } from '../../context/autoSaveContext.tsx';

export enum AutomationType {
    AUTO_SAVE = 'AUTO_SAVE',
    SUBSCRIPTION = 'SUBSCRIPTION',
    BILL_PAYMENT = 'BILL_PAYMENT',
    DCA_INVESTMENT = 'DCA_INVESTMENT',
    EMERGENCY_FUND = 'EMERGENCY_FUND',
    CHARITY_DONATION = 'CHARITY_DONATION',
    WALLET_CONSOLIDATION = 'WALLET_CONSOLIDATION',
}

interface AutoSaveFormData {
    thresholdAmount: string;
    targetSavingsAddress: string;
    tokenAddress: string;
    checkInterval: number;
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

interface AutoSaveModuleProps {
    open: boolean;
    onClose: () => void;
}

export const AutoSaveModule: React.FC<AutoSaveModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules: automations, loading, error, createRule, updateRule, deleteRule, refreshRules } = useAutoSave();
    const [formData, setFormData] = useState<AutoSaveFormData>({
        thresholdAmount: '',
        targetSavingsAddress: '',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        checkInterval: 3600
    });

    useEffect(() => {
        if (address && open) {
            refreshRules();
        }
    }, [address, open, refreshRules]); const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        try {
            const autoSaveRule = {
                userAddress: address,
                triggerAmount: formData.thresholdAmount,
                savingsPercentage: 100, // Save 100% above threshold
                destinationAddress: formData.targetSavingsAddress,
                tokenAddress: formData.tokenAddress,
                isActive: true
            };

            await createRule(autoSaveRule);
            setFormData({
                thresholdAmount: '',
                targetSavingsAddress: '',
                tokenAddress: '0x0000000000000000000000000000000000000000',
                checkInterval: 3600
            });
        } catch (err: any) {
            console.error('Failed to create auto-save rule:', err);
        }
    };

    const toggleAutomation = async (automationId: string, enabled: boolean) => {
        try {
            await updateRule(automationId, { isActive: enabled });
        } catch (err: any) {
            console.error('Failed to toggle automation:', err);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
                <h2 className="text-2xl font-bold mb-4 pondWater-font">Auto-Save Configuration</h2>
                {error && <div className="mb-4 text-red-600">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold">Threshold Amount (ETH)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.thresholdAmount}
                            onChange={e => setFormData({ ...formData, thresholdAmount: e.target.value })}
                            required
                            className="w-full p-2 rounded border border-gray-300 pondWater-font"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Savings Wallet Address</label>
                        <input
                            type="text"
                            value={formData.targetSavingsAddress}
                            onChange={e => setFormData({ ...formData, targetSavingsAddress: e.target.value })}
                            placeholder="0x..."
                            required
                            className="w-full p-2 rounded border border-gray-300 pondWater-font"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Token Address (0x0 for ETH)</label>
                        <input
                            type="text"
                            value={formData.tokenAddress}
                            onChange={e => setFormData({ ...formData, tokenAddress: e.target.value })}
                            placeholder="0x..."
                            className="w-full p-2 rounded border border-gray-300 pondWater-font"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold">Check Interval</label>
                        <select
                            value={formData.checkInterval}
                            onChange={e => setFormData({ ...formData, checkInterval: Number(e.target.value) })}
                            className="w-full p-2 rounded border border-gray-300 pondWater-font"
                        >
                            <option value={3600}>Every Hour</option>
                            <option value={21600}>Every 6 Hours</option>
                            <option value={86400}>Daily</option>
                            <option value={604800}>Weekly</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !address}
                        className="w-full bg-yellow-400 text-white font-bold py-2 rounded pondWater-font hover:bg-yellow-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Auto-Save'}
                    </button>
                </form>
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2 pondWater-font">Active Auto-Saves</h3>
                    {automations.length === 0 && <div className="text-gray-500">No auto-saves found.</div>}                    {automations.map(automation => (
                        <div key={automation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded mb-2">
                            <div>
                                <div className="font-semibold">Threshold: {automation.triggerAmount} ETH</div>
                                <div className="text-xs text-gray-600">Target: {automation.destinationAddress.slice(0, 10)}...</div>
                                <div className="text-xs text-gray-600">Savings: {automation.savingsPercentage}%</div>
                                <div className="text-xs text-gray-600">Status: {automation.isActive ? 'Active' : 'Inactive'}</div>
                            </div>
                            <button
                                onClick={() => toggleAutomation(automation.id, !automation.isActive)}
                                className={`px-3 py-1 rounded font-bold pondWater-font ${automation.isActive ? 'bg-red-400 text-white' : 'bg-green-400 text-white'}`}
                            >
                                {automation.isActive ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutoSaveModule;
