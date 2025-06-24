import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { useAuth } from '../hooks/useAuth.ts';
import { useSession } from '../hooks/useSession.ts';
import { api } from '../utils/api.ts';

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'wally.schmidtiest.xyz';
const SIWE_URI = process.env.NEXT_PUBLIC_SIWE_URI || `https://${DOMAIN}/auth`;

export function useAuthForm() {
    const { signInWithEthereum: signInWithEthereumWagmi } = useAuth();
    const { onLogin } = useSession();
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { data: walletClient } = useWalletClient();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ nonce: string }>('/login/nonce')
            .then(res => setNonce(res.data.nonce))
            .catch(() => setNonce(null));
    }, []);

    const signInWithEthereum = async (nonce: string) => {
        if (!address || !isConnected) throw new Error('Wallet not connected');
        const message = `Sign this message to authenticate. Nonce: ${nonce}`;

        try {
            setLoading(true);
            setError(null);

            const signature = await signMessageAsync({ message });

            // Call the backend to verify and create session
            const response = await api.post('/api/auth/ethereum', {
                message,
                signature,
                address
            });

            if (response.data.sessionId) {
                // Fix: onLogin expects only sessionId, not user data
                onLogin(response.data.sessionId);
                return response.data;
            }

            throw new Error('Invalid response from server');
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (formData: any) => {
        // Fix: Use the actual signInWithEthereum function that exists
        return signInWithEthereum(formData.nonce || nonce || '');
    };

    return {
        signInWithEthereum,
        loading,
        error,
        nonce,
        handleSubmit,
    };
}
