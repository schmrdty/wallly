import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMultiWalletConsolidation } from '../../context/multiWalletConsolidationContext.tsx';

interface MultiWalletConsolidationModuleProps {
    open: boolean;
    onClose: () => void;
}

const MultiWalletConsolidationModule: React.FC<MultiWalletConsolidationModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules, createRule, updateRule, deleteRule, refreshRules, loading, error: contextError } = useMultiWalletConsolidation();
    const [primaryWallet, setPrimaryWallet] = useState('');
    const [sourceWallets, setSourceWallets] = useState<string[]>(['']);
    const [tokenAddresses, setTokenAddresses] = useState<string[]>(['']);
    const [threshold, setThreshold] = useState('');
    const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'manual'>('daily');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    useEffect(() => {
        if (address && open) {
            refreshRules();
        }
    }, [address, open, refreshRules]);

    const toggleRule = async (ruleId: string, isActive: boolean) => {
        try {
            await updateRule(ruleId, { isActive });
        } catch (err: any) {
            setError(err.message || 'Failed to toggle rule');
        }
    };

    const handleDelete = async (ruleId: string) => {
        try {
            await deleteRule(ruleId);
        } catch (err: any) {
            setError(err.message || 'Failed to delete rule');
        }
    };

    const handleSourceWalletChange = (idx: number, value: string) => {
        const updated = [...sourceWallets];
        updated[idx] = value;
        setSourceWallets(updated);
    };
    const handleTokenAddressChange = (idx: number, value: string) => {
        const updated = [...tokenAddresses];
        updated[idx] = value;
        setTokenAddresses(updated);
    };
    const addSourceWallet = () => setSourceWallets([...sourceWallets, '']);
    const addTokenAddress = () => setTokenAddresses([...tokenAddresses, '']);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        setError(null);
        try {
            if (!address) throw new Error('Wallet not connected');
            await createRule({
                userAddress: address,
                primaryWallet,
                sourceWallets,
                tokenAddresses,
                threshold,
                frequency,
                isActive: true,
                lastConsolidated: undefined
            });
            setStatus('Multi-wallet consolidation rule created successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to create multi-wallet consolidation rule');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Multi-Wallet Consolidation Flow</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Primary Wallet Address"
                        value={primaryWallet}
                        onChange={e => setPrimaryWallet(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <div className="space-y-2">
                        <label className="block font-semibold">Source Wallets</label>
                        {sourceWallets.map((wallet, idx) => (
                            <input
                                key={idx}
                                type="text"
                                placeholder={`Source Wallet #${idx + 1}`}
                                value={wallet}
                                onChange={e => handleSourceWalletChange(idx, e.target.value)}
                                className="w-full border px-3 py-2 rounded mb-1"
                                required
                            />
                        ))}
                        <button type="button" className="text-blue-600 underline" onClick={addSourceWallet}>+ Add Source Wallet</button>
                    </div>
                    <div className="space-y-2">
                        <label className="block font-semibold">Token Addresses</label>
                        {tokenAddresses.map((token, idx) => (
                            <input
                                key={idx}
                                type="text"
                                placeholder={`Token Address #${idx + 1}`}
                                value={token}
                                onChange={e => handleTokenAddressChange(idx, e.target.value)}
                                className="w-full border px-3 py-2 rounded mb-1"
                            />
                        ))}
                        <button type="button" className="text-blue-600 underline" onClick={addTokenAddress}>+ Add Token</button>
                    </div>
                    <input
                        type="number"
                        placeholder="Consolidation Threshold (ETH)"
                        value={threshold}
                        onChange={e => setThreshold(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as any)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="manual">Manual</option>
                    </select>
                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full"
                        disabled={!address}
                    >
                        Schedule Consolidation
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Active Consolidations</h3>
                    {rules.length === 0 && <div className="text-gray-500">No consolidations found.</div>}
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded mb-2">
                            <div>
                                <div className="font-semibold">Primary: {rule.primaryWallet.slice(0, 10)}...</div>
                                <div className="text-xs text-gray-600">Sources: {rule.sourceWallets.length} wallets</div>
                                <div className="text-xs text-gray-600">Threshold: {rule.threshold} ETH - {rule.frequency}</div>
                                <div className="text-xs text-gray-600">Status: {rule.isActive ? 'Active' : 'Inactive'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleRule(rule.id, !rule.isActive)}
                                    className={`px-3 py-1 rounded text-sm ${rule.isActive ? 'bg-red-400 text-white' : 'bg-green-400 text-white'}`}
                                >
                                    {rule.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="px-3 py-1 rounded text-sm bg-gray-400 text-white"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {status && <div className="mt-4 text-green-600">{status}</div>}
                {error && <div className="mt-4 text-red-600">{error}</div>}
                {contextError && <div className="mt-4 text-red-600">{contextError}</div>}
                <button className="mt-6 px-4 py-2 bg-gray-400 text-white rounded" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default MultiWalletConsolidationModule;
