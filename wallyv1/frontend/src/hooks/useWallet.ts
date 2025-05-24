import { useState, useEffect, useCallback } from 'react';
// Fix: Import the whole walletService and use its methods
import * as walletService from '../services/walletService';
import type { ExternalProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export interface UseWalletResult {
  walletAddress: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWallet = (): UseWalletResult => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Memoize handlers to avoid stale closures
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletAddress(null);
      setIsConnected(false);
    } else {
      setWalletAddress(accounts[0]);
      setIsConnected(true);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    // integrate WalletConnect/Coinbase Wallet here

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleDisconnect]);

  const connect = useCallback(async () => {
    // Use walletService.connectWallet if it exists, otherwise throw
    if (typeof walletService.connectWallet !== 'function') {
      throw new Error('connectWallet is not implemented in walletService');
    }
    const address = await walletService.connectWallet();
    setWalletAddress(address);
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(async () => {
    if (typeof walletService.disconnectWallet !== 'function') {
      throw new Error('disconnectWallet is not implemented in walletService');
    }
    await walletService.disconnectWallet();
    setWalletAddress(null);
    setIsConnected(false);
  }, []);

  const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);

  return {
    walletAddress,
    isConnected,
    connect,
    disconnect,
  };
};

export default useWallet;
