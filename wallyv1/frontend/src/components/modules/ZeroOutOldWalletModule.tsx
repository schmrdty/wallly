import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useZeroOutOldWallet } from '../../context/zeroOutOldWalletContext.tsx';
import { parseEther } from 'viem';
// import { ZeroOutOldWalletAbi } from '../../abis/ZeroOutOldWalletAbi.js'; // Replace with your ABI import

interface ZeroOutOldWalletModuleProps {
    open: boolean;
    onClose: () => void;
}

const ZeroOutOldWalletModule: React.FC<ZeroOutOldWalletModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules, createRule, updateRule, deleteRule, refreshRules, loading, error: contextError } = useZeroOutOldWallet();
    const [sourceWallet, setSourceWallet] = useState('');
    const [targetWallet, setTargetWallet] = useState('');
    const [includeNFTs, setIncludeNFTs] = useState(true);
    const [includeTokens, setIncludeTokens] = useState(true);
    const [includeNative, setIncludeNative] = useState(true);
    const [minTokenValueUSD, setMinTokenValueUSD] = useState('0');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // const { writeContractAsync } = useWriteContract(); // Uncomment and configure for your contract

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
                sourceWallet,
                targetWallet,
                includeNFTs,
                includeTokens,
                includeNative,
                minTokenValueUSD,
                isActive: true,
                lastExecuted: undefined
            });
            setStatus('Zero-out rule created successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to create zero-out rule');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Zero-Out Old Wallet Flow</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Source Wallet Address"
                        value={sourceWallet}
                        onChange={e => setSourceWallet(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Target Wallet Address"
                        value={targetWallet}
                        onChange={e => setTargetWallet(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input type="checkbox" checked={includeNFTs} onChange={e => setIncludeNFTs(e.target.checked)} />
                            <span className="ml-2">Include NFTs</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" checked={includeTokens} onChange={e => setIncludeTokens(e.target.checked)} />
                            <span className="ml-2">Include Tokens</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" checked={includeNative} onChange={e => setIncludeNative(e.target.checked)} />
                            <span className="ml-2">Include Native</span>
                        </label>
                    </div>
                    <input
                        type="number"
                        placeholder="Min Token Value (USD)"
                        value={minTokenValueUSD}
                        onChange={e => setMinTokenValueUSD(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />
                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full"
                        disabled={!address}
                    >
                        Schedule Zero-Out
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Active Zero-Out Rules</h3>
                    {rules.length === 0 && <div className="text-gray-500">No zero-out rules found.</div>}
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-red-50 rounded mb-2">
                            <div>
                                <div className="font-semibold">From: {rule.sourceWallet.slice(0, 10)}... → To: {rule.targetWallet.slice(0, 10)}...</div>
                                <div className="text-xs text-gray-600">
                                    Include: {rule.includeNFTs ? 'NFTs ' : ''}{rule.includeTokens ? 'Tokens ' : ''}{rule.includeNative ? 'Native' : ''}
                                </div>
                                <div className="text-xs text-gray-600">Min Value: ${rule.minTokenValueUSD}</div>
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

export default ZeroOutOldWalletModule;
