'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { getPublicClient } from '../utils/rpcService';
import { api } from '../utils/api';
import { useSessionContext } from './SessionContext';
import { logger } from '../utils/logger';
import { throttle } from '../utils/throttle';
import WALLY_GRANT_ABI from '../abis/wally_grant.js';

interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
}

interface WalletContextType {
  // Wagmi integration
  isWalletConnected: boolean;
  walletAddress: `0x${string}` | null;
  chainId: number | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // Authentication integration
  isAuthenticated: boolean;
  canUseAutomation: boolean;

  // Legacy wallet API (keeping for compatibility)
  address: `0x${string}` | null;
  setAddress: (address: `0x${string}` | null) => void;
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  loading: boolean;
  error: Error | null;
  refreshBalances: () => void;
  hasGrantedPermission: boolean;
  grantPermission: (
    withdrawalAddress: `0x${string}`,
    allowEntireWallet: boolean,
    durationSeconds: number,
    tokens: `0x${string}`[],
    minBalances: bigint[],
    limits: bigint[]
  ) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Wagmi hooks
  const { address: wagmiAddress, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Session context
  const { user, isAuthenticated: isFarcasterAuthenticated } = useSessionContext();

  // Legacy state (keeping for compatibility)
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [hasGrantedPermission, setHasGrantedPermission] = useState(false);

  // Sync wagmi address with legacy address state
  useEffect(() => {
    if (wagmiAddress && wagmiAddress !== address) {
      setAddress(wagmiAddress);
      logger.info('Wallet address synced from Wagmi', { address: wagmiAddress });
    } else if (!wagmiAddress && address) {
      setAddress(null);
      logger.info('Wallet address cleared (disconnected)');
    }
  }, [wagmiAddress, address]);

  // Check if user can use automation features
  const canUseAutomation = isFarcasterAuthenticated && isConnected && !!wagmiAddress;

  // Connect wallet function
  const connectWallet = async (): Promise<void> => {
    try {
      logger.info('Attempting to connect wallet', {
        availableConnectors: connectors.length,
        isFarcasterAuthenticated,
        userCustody: user?.custody
      });

      // Look for Farcaster Frame connector first
      const farcasterConnector = connectors.find(c => c.name === 'Farcaster Frame');
      const connector = farcasterConnector || connectors[0];

      if (!connector) {
        throw new Error('No wallet connectors available. Please make sure you are accessing this app through Farcaster.');
      }

      await connect({ connector });
      logger.info('Wallet connection initiated with connector:', connector.name);
    } catch (err: any) {
      logger.error('Wallet connection failed', { error: err?.message });
      throw err;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      disconnect();
      setAddress(null);
      setHasGrantedPermission(false);
      logger.info('Wallet disconnected');
    } catch (err: any) {
      logger.error('Wallet disconnect failed', { error: err?.message });
    }
  };

  // Auto-connect to Farcaster Frame connector when authenticated
  useEffect(() => {
    const autoConnect = async () => {
      if (isFarcasterAuthenticated && !isConnected && !isPending) {
        const farcasterConnector = connectors.find(c => c.name === 'Farcaster Frame');

        if (farcasterConnector) {
          try {
            logger.info('Auto-connecting to Farcaster Frame connector');
            await connect({ connector: farcasterConnector });
          } catch (error) {
            logger.warn('Auto-connect failed, user will need to manually connect', { error });
          }
        }
      }
    };

    // Delay auto-connect to allow connectors to initialize
    const timer = setTimeout(autoConnect, 1000);
    return () => clearTimeout(timer);
  }, [isFarcasterAuthenticated, isConnected, isPending, connectors, connect]);

  // Fetch native balance with throttling
  const currentAddress = wagmiAddress || address;
  const {
    data: nativeBalance,
    isLoading: loadingNative,
    error: nativeError,
    refetch: refetchNative
  } = useQuery({
    queryKey: ['nativeBalance', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return '0';
      try {
        const client = getPublicClient();
        const balance = await client.getBalance({ address: currentAddress });
        return formatEther(balance);
      } catch (error) {
        logger.warn('Failed to fetch native balance, returning 0', { error });
        return '0';
      }
    },
    enabled: !!currentAddress,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000 // Refetch every 60 seconds instead of constantly
  });

  // Fetch token balances with throttling
  const {
    data: tokenBalances,
    isLoading: loadingTokens,
    error: tokensError,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['tokenBalances', currentAddress],
    queryFn: async () => {
      if (!currentAddress) return [];
      try {
        const response = await api.get(`/api/walletRoutes/${currentAddress}/tokens`);
        return response.data.map((token: any) => ({
          ...token,
          formattedBalance: formatUnits(BigInt(token.balance || '0'), token.decimals || 18)
        }));
      } catch (error) {
        logger.warn('Failed to fetch token balances, returning empty array', { error });
        return [];
      }
    },
    enabled: !!currentAddress,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000 // Refetch every 60 seconds instead of constantly
  });

  // Check if user has granted permission to Wally with throttling
  useEffect(() => {
    if (!currentAddress) return;

    const checkPermission = throttle(
      `permission-check-${currentAddress}`,
      async () => {
        try {
          const result = await api.get(`/api/permission/check?address=${currentAddress}`);
          setHasGrantedPermission(result.data.hasPermission || false);
        } catch (err) {
          logger.warn('Failed to check permissions, defaulting to false', { error: err });
          setHasGrantedPermission(false);
        }
      },
      5000 // Throttle to max once every 5 seconds
    );

    checkPermission();
  }, [currentAddress]);

  // Function to grant permission to Wally contract
  const grantPermission = async (
    withdrawalAddress: `0x${string}`,
    allowEntireWallet: boolean,
    durationSeconds: number,
    tokens: `0x${string}`[],
    minBalances: bigint[],
    limits: bigint[]
  ) => {
    if (!currentAddress) throw new Error('Wallet not connected');

    try {
      const response = await api.post('/api/permission/grant', {
        userAddress: currentAddress,
        withdrawalAddress,
        allowEntireWallet,
        durationSeconds,
        tokens,
        minBalances: minBalances.map(b => b.toString()),
        limits: limits.map(l => l.toString())
      });

      setHasGrantedPermission(true);
      return response.data.txHash;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw error;
    }
  };

  const refreshBalances = () => {
    if (currentAddress) {
      refetchNative();
      refetchTokens();
    }
  };

  // Log state changes for debugging
  useEffect(() => {
    logger.info('Wallet context state updated', {
      isAuthenticated: isFarcasterAuthenticated,
      isWalletConnected: isConnected,
      walletAddress: wagmiAddress,
      canUseAutomation,
      userAddress: user?.address,
      userCustody: user?.custody,
      hasGrantedPermission
    });
  }, [isFarcasterAuthenticated, isConnected, wagmiAddress, canUseAutomation, user?.address, user?.custody, hasGrantedPermission]);

  return (
    <WalletContext.Provider
      value={{
        // Wagmi integration
        isWalletConnected: isConnected,
        walletAddress: wagmiAddress || null,
        chainId: chainId || null,
        isConnecting: isPending,
        connectWallet,
        disconnectWallet,

        // Authentication integration
        isAuthenticated: isFarcasterAuthenticated,
        canUseAutomation,

        // Legacy wallet API (keeping for compatibility)
        address: currentAddress,
        setAddress,
        nativeBalance: nativeBalance || '0',
        tokenBalances: tokenBalances || [],
        loading: loadingNative || loadingTokens,
        error: nativeError || tokensError || null,
        refreshBalances,
        hasGrantedPermission,
        grantPermission
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};