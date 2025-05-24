import React from 'react';
import { useTransferForm } from '../hooks/useTransferForm';
import { TransferStatus } from './TransferStatus';

const TransferForm: React.FC = () => {
    const {
        user,
        tokenAddress,
        setTokenAddress,
        amount,
        setAmount,
        recipient,
        setRecipient,
        allowEntireWallet,
        setAllowEntireWallet,
        status,
        tokenWarning,
        validation,
        handleTokenInput,
        handleSubmit,
        isSubmitting
    } = useTransferForm();

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Token Address / Symbol:
                <input
                    value={tokenAddress}
                    onChange={e => handleTokenInput(e.target.value)}
                    required
                    style={{
                        borderColor: validation.valid ? 'green' : 'yellow',
                    }}
                />
            </label>
            <TransferStatus warning={tokenWarning} status={status} />
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
            <button type="submit" disabled={!user || isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </form>
    );
};

export default TransferForm;
