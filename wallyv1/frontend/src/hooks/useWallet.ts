import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    async function fetchWalletDetails() {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setWalletAddress(accounts[0]);
        setIsConnected(accounts.length > 0);

        const balance = await provider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(balance));
      } else {
        setIsConnected(false);
      }
    }

    fetchWalletDetails();
  }, []);

  return { walletAddress, balance, isConnected };
}

export default useWallet;
