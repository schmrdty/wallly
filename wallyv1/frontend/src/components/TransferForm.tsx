import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { transferTokens } from '../utils/api';
import { validateTokenAddress, validateTransferAmount } from '../utils/validators';

const TransferForm: React.FC = () => {
    const { user } = useAuth();
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [allowEntireWallet, setAllowEntireWallet] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);
        if (!validateTokenAddress(tokenAddress)) {
            setStatus('Invalid token address.');
            return;
        }
        if (!validateTransferAmount(amount)) {
            setStatus('Invalid amount.');
            return;
        }
        if (!recipient) {
            setStatus('Recipient required.');
            return;
        }
        try {
            await transferTokens({
                userAddress: user.address,
                tokenAddress,
                amount,
                recipient,
                allowEntireWallet,
            });
            setStatus('Transfer submitted!');
        } catch (err: any) {
            setStatus('Transfer failed: ' + (err.message || 'Unknown error'));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Token Address:
                <input value={tokenAddress} onChange={e => setTokenAddress(e.target.value)} required />
            </label>
            <label>
                Amount:
                <input value={amount} onChange={e => setAmount(e.target.value)} required />
            </label>
            <label>
                Recipient:
                <input value={recipient} onChange={e => setRecipient(e.target.value)} required />
            </label>
            <label>
                Allow Entire Wallet:
                <select
                    value={allowEntireWallet ? 'true' : 'false'}
                    onChange={e => setAllowEntireWallet(e.target.value === 'true')}
                >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </label>
            <button type="submit" disabled={!user}>Submit</button>
            {status && <div style={{ marginTop: 8, color: status.includes('failed') ? 'red' : 'green' }}>{status}</div>}
        </form>
    );
};

export default TransferForm;