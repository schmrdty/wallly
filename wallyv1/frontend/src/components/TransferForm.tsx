import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateTokenAddress } from '../utils/validators';
import { roundRobinTokenResolve } from '../utils/tokenSearch';
import { transferTokens } from '../utils/api';

const TransferForm: React.FC = () => {
    const { user } = useAuth();
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resolving, setResolving] = useState(false);

    const handleTokenInputBlur = async () => {
        setResolving(true);
        setError('');
        try {
            const result = await roundRobinTokenResolve(tokenAddress);
            if (result.valid && result.address) {
                setTokenAddress(result.address);
                setError('');
            } else if (result.suggestion) {
                setError(`Did you mean: ${result.suggestion} (${result.symbol})?`);
            } else {
                setError('Token not found.');
            }
        } catch (e) {
            setError('Error resolving token.');
        } finally {
            setResolving(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateTokenAddress(tokenAddress)) {
            setError('Invalid token address.');
            return;
        }

        if (!amount || !recipient) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const response = await transferTokens(user, tokenAddress, amount, recipient);
            if (response.success) {
                setSuccess('Transfer successful!');
                setTokenAddress('');
                setAmount('');
                setRecipient('');
            } else {
                setError(response.message || 'Transfer failed.');
            }
        } catch (err) {
            setError('An error occurred during the transfer.');
        }
    };

    return (
        <div>
            <h2>Transfer Tokens</h2>
            <form onSubmit={handleTransfer}>
                <div>
                    <label htmlFor="tokenAddress">Token Address:</label>
                    <input
                        type="text"
                        id="tokenAddress"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        onBlur={handleTokenInputBlur}
                        required
                    />
                    {resolving && <span>Resolving token...</span>}
                </div>
                <div>
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="recipient">Recipient Address:</label>
                    <input
                        type="text"
                        id="recipient"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit">Transfer</button>
            </form>
        </div>
    );
};

export default TransferForm;