import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { ExternalProvider } from '@ethersproject/providers';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../hooks/useSession';
import { api } from '../utils/api';

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'wally.schmidtiest.xyz';
const SIWE_URI = process.env.NEXT_PUBLIC_SIWE_URI || `https://${DOMAIN}/login`;

export function useAuthForm() {
    const { signInWithEthereum } = useAuth();
    const { onLogin } = useSession();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ nonce: string }>('/login/nonce')
            .then(res => setNonce(res.data.nonce))
            .catch(() => setNonce(null));
    }, []);

    const handleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!nonce) throw new Error('Nonce not loaded');
            if (!window.ethereum) throw new Error('No Ethereum provider found');
            const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            const siweMessage = [
                `${DOMAIN} wants you to sign in with your Ethereum account:`,
                address,
                '',
                `URI: ${SIWE_URI}`,
                `Version: 1`,
                `Chain ID: 1`,
                `Nonce: ${nonce}`,
                `Issued At: ${new Date().toISOString()}`
            ].join('\n');

            const signature = await signer.signMessage(siweMessage);

            const loginRes = await api.post('/login', {
                message: siweMessage,
                signature
            });

            const { sessionId, address: userAddress, fid } = loginRes.data;
            onLogin(sessionId);
            signInWithEthereum({ walletAddress: userAddress, fid });

        } catch (err: any) {
            setError(err.message || 'Sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        handleSignIn,
        nonceLoaded: !!nonce
    };
}
