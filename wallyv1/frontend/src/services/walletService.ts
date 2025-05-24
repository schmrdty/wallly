import { api } from '../utils/api';
import { logger } from '../utils/logger';
import { handleWalletServiceError } from './walletServiceHelpers';

/**
 * Connect to the user's Ethereum wallet (MetaMask).
 * @returns {Promise<string>} The connected wallet address.
 */
export async function connectWallet(): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found');
  }
  // Cast to the correct type to ensure request() is available
  const eth = window.ethereum as typeof window.ethereum & { request: (args: { method: string; params?: Array<any> }) => Promise<any> };
  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found');
  }
  // Optionally, store the address in localStorage for session persistence
  localStorage.setItem('walletAddress', accounts[0]);
  return accounts[0];
}

/**
 * Disconnect wallet (MetaMask does not support programmatic disconnect, so just a placeholder).
 */
export async function disconnectWallet(): Promise<void> {
  // MetaMask does not support programmatic disconnect.
  // You can clear any local state or perform other cleanup here.
  localStorage.removeItem('walletAddress');
  // If you use a context or state management, reset wallet state here.
  return;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  amount: string;
}

export interface WalletBalanceResponse {
  native: string;
  tokens: TokenBalance[];
}

export interface TransactionPreviewResponse {
  estimatedGas: string;
  fee: string;
  [key: string]: any;
}

export interface SendTransactionResponse {
  transactionHash: string;
  [key: string]: any;
}

export interface BatchTransactionsResponse {
  transactionHashes: string[];
  [key: string]: any;
}

/**
 * Fetch wallet balances (native and ERC20).
 */
export const getWalletBalance = async (walletAddress: string): Promise<WalletBalanceResponse> => {
  try {
    const response = await api.get<WalletBalanceResponse>(`/wallets/${walletAddress}/balance`);
    logger.contractEvent('WalletBalanceFetched', { walletAddress });
    return response.data;
  } catch (error) {
    handleWalletServiceError(error, 'fetch wallet balance');
    throw error;
  }
};

/**
 * Preview a transaction (simulate, get gas, etc).
 */
export const previewTransaction = async (txDetails: Record<string, any>): Promise<TransactionPreviewResponse> => {
  try {
    const response = await api.post<TransactionPreviewResponse>('/wallets/preview', txDetails);
    logger.contractEvent('TransactionPreviewed', txDetails);
    return response.data;
  } catch (error) {
    handleWalletServiceError(error, 'preview transaction');
    throw error;
  }
};

/**
 * Send a transaction (native or ERC20).
 */
export const sendTransaction = async (txDetails: Record<string, any>): Promise<SendTransactionResponse> => {
  try {
    const response = await api.post<SendTransactionResponse>('/wallets/send', txDetails);
    logger.contractEvent('TransactionSent', { ...txDetails, transactionHash: response.data?.transactionHash });
    return response.data;
  } catch (error) {
    logger.contractError('SendTransactionFailed', txDetails);
    handleWalletServiceError(error, 'send transaction');
    throw error;
  }
};

/**
 * Batch transactions.
 */
export const batchTransactions = async (batchDetails: Record<string, any>): Promise<BatchTransactionsResponse> => {
  try {
    const response = await api.post<BatchTransactionsResponse>('/wallets/batch', batchDetails);
    logger.contractEvent('BatchTransactionsSent', { ...batchDetails, transactionHashes: response.data?.transactionHashes });
    return response.data;
  } catch (error) {
    logger.contractError('BatchTransactionsFailed', batchDetails);
    handleWalletServiceError(error, 'batch transactions');
    throw error;
  }
};