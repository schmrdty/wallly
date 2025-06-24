import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useBillPayment } from '../../context/billPaymentContext.tsx';
import { parseEther } from 'viem';
// import { BillPaymentAbi } from '../../abis/BillPaymentAbi.js'; // Replace with your ABI import

interface BillPaymentModuleProps {
    open: boolean;
    onClose: () => void;
}

const BillPaymentModule: React.FC<BillPaymentModuleProps> = ({ open, onClose }) => {
    const { address } = useAccount();
    const { rules, createRule, updateRule, deleteRule, refreshRules, loading, error: contextError } = useBillPayment();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('0x0000000000000000000000000000000000000000');
    const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // const { writeContractAsync } = useWriteContract(); // Uncomment and configure for your contract

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

    if (!open) return null;

    // Validation helper functions
    const validateEthAddress = (address: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const validateAmount = (amount: string): boolean => {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0;
    };

    // Form validation function
    const validateForm = (): string | null => {
        if (!validateAmount(recipient)) return 'Invalid recipient address';
        if (!validateAmount(amount)) return 'Invalid amount';
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000' && !validateEthAddress(tokenAddress)) {
            return 'Invalid token address';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            if (!address) throw new Error('Wallet not connected');
            await createRule({
                userAddress: address,
                recipient,
                amount,
                tokenAddress,
                frequency,
                isActive: true,
                lastPaid: undefined
            });
            setStatus('Bill payment rule created successfully!');
            // Reset form
            setRecipient('');
            setAmount('');
            setTokenAddress('0x0000000000000000000000000000000000000000');
            setFrequency('monthly');
        } catch (err: any) {
            setError(err.message || 'Failed to create bill payment rule');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Bill Payment Flow</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Recipient Address"
                        value={recipient}
                        onChange={e => setRecipient(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Amount (ETH)"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
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
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as any)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom</option>
                    </select>
                    <button
                        type="submit"
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full"
                        disabled={!address}
                    >
                        Schedule Bill Payment
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Active Bill Payments</h3>
                    {rules.length === 0 && <div className="text-gray-500">No bill payments found.</div>}
                    {rules.map(rule => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-blue-50 rounded mb-2">
                            <div>
                                <div className="font-semibold">{rule.amount} ETH to {rule.recipient.slice(0, 10)}...</div>
                                <div className="text-xs text-gray-600">Frequency: {rule.frequency}</div>
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

export default BillPaymentModule;
