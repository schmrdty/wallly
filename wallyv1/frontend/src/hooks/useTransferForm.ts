import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { transferTokens } from '../utils/api.ts';
import { validateTokenAddress, validateTransferAmount } from '../utils/validators.ts';
import { roundRobinTokenResolve } from '../utils/tokenSearch.ts';
import { logger } from '../utils/logger.ts';

export function useTransferForm() {
    const { user } = useAuth();
    const [tokenAddress, setTokenAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [allowEntireWallet, setAllowEntireWallet] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [tokenWarning, setTokenWarning] = useState('');
    const [validation, setValidation] = useState<{ valid: boolean, suggestion?: string, symbol?: string, name?: string, address?: string }>({ valid: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTokenInput = async (value: string) => {
        setTokenAddress(value);
        const result = await roundRobinTokenResolve(value);
        setValidation(result);

        if (!result.valid) {
            setTokenWarning(result.suggestion
                ? `Token not found. Did you mean ${result.suggestion} (${result.symbol})?`
                : 'Token not found in list. You can proceed, but please double-check the address.');
            logger.warn('Token not found or fuzzy match', { userId: user?.id, input: value, suggestion: result.suggestion });
        } else {
            setTokenWarning('');
        }
    };

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
        if (!user) {
            setStatus('User not authenticated.');
            return;
        }
        setIsSubmitting(true);
        try {
            await transferTokens({
                userAddress: user.id,
                tokenAddress,
                amount,
                recipient,
                allowEntireWallet,
            });
            setStatus('Transfer submitted!');
        } catch (err: any) {
            setStatus('Transfer failed: ' + (err.message || 'Unknown error'));
        }
        setIsSubmitting(false);
    };

    return {
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
    };
}
