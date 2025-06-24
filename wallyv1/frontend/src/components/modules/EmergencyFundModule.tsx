import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useEmergencyFund } from '../../context/emergencyFundContext.tsx';

interface EmergencyFundModuleProps {
    open: boolean;
    onClose: () => void;
}

const EmergencyFundModule: React.FC<EmergencyFundModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules, createRule, updateRule, deleteRule, refreshRules, loading, error: contextError } = useEmergencyFund();
    const [minBalance, setMinBalance] = useState('');
    const [topUpAmount, setTopUpAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('0x0000000000000000000000000000000000000000');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        setError(null);
        try {
            if (!address) throw new Error('Wallet not connected');
            await createRule({
                userAddress: address,
                minBalance,
                topUpAmount,
                tokenAddress,
                isActive: true,
                lastToppedUp: undefined
            });
            setStatus('Emergency fund rule created successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to create emergency fund rule');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Emergency Fund Flow</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="number"
                        placeholder="Minimum Balance (ETH)"
                        value={minBalance}
                        onChange={e => setMinBalance(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Top-Up Amount (ETH)"
                        value={topUpAmount}
                        onChange={e => setTopUpAmount(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Token Address (optional)"
                        value={tokenAddress}
                        onChange={e => setTokenAddress(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />
                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full"
                        disabled={!address}
                    >
                        Save Emergency Fund
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Active Emergency Funds</h3>
                    {rules.length === 0 && <div className="text-gray-500">No emergency funds found.</div>}
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-orange-50 rounded mb-2">
                            <div>
                                <div className="font-semibold">Min: {rule.minBalance} ETH, Top-up: {rule.topUpAmount} ETH</div>
                                <div className="text-xs text-gray-600">Token: {rule.tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : rule.tokenAddress.slice(0, 10) + '...'}</div>
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

export default EmergencyFundModule;
