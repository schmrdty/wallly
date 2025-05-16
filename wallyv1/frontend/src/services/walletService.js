import { api } from '../utils/api';

// Fetch wallet balances (native and ERC20)
export const getWalletBalance = async (walletAddress) => {
    try {
        const response = await api.get(`/wallets/${walletAddress}/balance`);
        return response.data; // { native: string, tokens: [{ address, symbol, amount }] }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch wallet balance');
    }
};

// Preview a transaction (simulate, get gas, etc)
export const previewTransaction = async (txDetails) => {
    try {
        const response = await api.post('/wallets/preview', txDetails);
        return response.data; // { estimatedGas, fee, ... }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to preview transaction');
    }
};

// Send a transaction (native or ERC20)
export const sendTransaction = async (txDetails) => {
    try {
        const response = await api.post('/wallets/send', txDetails);
        return response.data; // { transactionHash }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to send transaction');
    }
};

// Batch transactions
export const batchTransactions = async (batchDetails) => {
    try {
        const response = await api.post('/wallets/batch', batchDetails);
        return response.data; // { transactionHashes: [] }
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to batch transactions');
    }
};