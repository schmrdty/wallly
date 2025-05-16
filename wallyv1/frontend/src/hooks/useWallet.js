import { useState, useEffect } from 'react';
import { connectWallet, disconnectWallet } from '../services/walletService';

const useWallet = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setWalletAddress(null);
                setIsConnected(false);
            } else {
                setWalletAddress(accounts[0]);
                setIsConnected(true);
            }
        };
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('disconnect', () => {
                setWalletAddress(null);
                setIsConnected(false);
            });
        }
        //  integrate WalletConnect/Coinbase Wallet here

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('disconnect', () => {});
            }
        };
    }, []);

    const connect = async () => {
        const address = await connectWallet();
        setWalletAddress(address);
        setIsConnected(true);
    };

    const disconnect = async () => {
        await disconnectWallet();
        setWalletAddress(null);
        setIsConnected(false);
    };

    return {
        walletAddress,
        isConnected,
        connect,
        disconnect,
    };
};

export default useWallet;