import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import axios from 'axios';
import logger from '../infra/mon/logger.js';
import dotenv from 'dotenv';
import redisClient from '../db/redisClient.js';
import { getNextRpcUrl } from '../utils/rpcProvider.js';

dotenv.config();

export interface Wallet {
    id: string;
    userId: string;
    userEmail: string;
    type: 'coinbase' | 'other';
    address?: string;
}

// Cache for wallet instances
const walletCache: Record<string, { id: string, address: string, type: 'coinbase' | 'other' }> = {};

/**
 * Get wallet info from Redis
 */
export async function getWalletInfo(walletId: string): Promise<Wallet | null> {
    const data = await redisClient.get(`wallet:${walletId}`);
    return data ? JSON.parse(data) : null;
}

/**
 * Create a new wallet in Redis
 */
export async function createWallet(wallet: Omit<Wallet, 'id'>): Promise<Wallet> {
    const id = `wlt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const newWallet: Wallet = { ...wallet, id };
    await redisClient.set(`wallet:${id}`, JSON.stringify(newWallet));

    // Cache wallet for quick access
    if (newWallet.address) {
        walletCache[id] = {
            id,
            address: newWallet.address,
            type: newWallet.type
        };
    }

    return newWallet;
}

/**
 * Update existing wallet in Redis
 */
export async function updateWallet(walletId: string, updates: Partial<Omit<Wallet, 'id' | 'userId'>>): Promise<Wallet | null> {
    const wallet = await getWalletInfo(walletId);
    if (!wallet) return null;

    const updatedWallet = { ...wallet, ...updates };
    await redisClient.set(`wallet:${walletId}`, JSON.stringify(updatedWallet));

    // Update cache
    if (updatedWallet.address && updatedWallet.type) {
        walletCache[walletId] = {
            id: walletId,
            address: updatedWallet.address,
            type: updatedWallet.type
        };
    }

    return updatedWallet;
}

/**
 * Delete a wallet from Redis
 */
export async function deleteWallet(walletId: string): Promise<boolean> {
    const result = await redisClient.del(`wallet:${walletId}`);

    // Remove from cache
    if (walletCache[walletId]) {
        delete walletCache[walletId];
    }

    return Boolean(result > 0);
}

/**
 * Get wallet balance using the round-robin RPC provider
 */
export async function getWalletBalance(walletAddress: string): Promise<string> {
    try {
        const rpcUrl = getNextRpcUrl();
        const client = createPublicClient({
            transport: http(rpcUrl),
        });
        const balance = await client.getBalance({ address: walletAddress as `0x${string}` });
        return formatEther(balance);
    } catch (error) {
        logger.error(`Error fetching wallet balance: ${error}`);
        // Try with an alternative RPC
        const rpcUrl = getNextRpcUrl(); // Get another RPC URL
        try {
            const client = createPublicClient({
                transport: http(rpcUrl),
            });
            const balance = await client.getBalance({ address: walletAddress as `0x${string}` });
            return formatEther(balance);
        } catch (retryError) {
            logger.error(`Retry failed for wallet balance: ${retryError}`);
            throw retryError;
        }
    }
}

/**
 * Send ETH transaction using viem (ONLY USE FOR RELAYER ACCOUNTS, NEVER USER PRIVATE KEYS)
 * This should only be called with backend-controlled accounts, never user accounts
 */
export const sendTransaction = async (
    privateKey: string,
    to: string,
    value: string,
    providerUrl: string
): Promise<string> => {
    if (!privateKey || privateKey.length < 64) {
        throw new Error('Invalid private key format');
    }

    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const client = createWalletClient({
        account,
        transport: http(providerUrl),
    });

    const hash = await client.sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(value),
        chain: null,
    });
    return hash;
};

/**
 * Create a Coinbase Smart Wallet via API
 */
export async function createCoinbaseSmartWallet(userId: string, userEmail: string): Promise<Wallet> {
    try {
        const apiKey = process.env.COINBASE_API_KEY;
        if (!apiKey) {
            logger.error('COINBASE_API_KEY not set in environment');
            throw new Error('Missing Coinbase API configuration');
        }

        const url = 'https://api.cdp.coinbase.com/v1/wallets';
        const response = await axios.post(
            url,
            {
                user_id: userId,
                email: userEmail,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        logger.info(`Coinbase Smart Wallet created for user ${userId}`);

        // Create wallet in our system
        const wallet = await createWallet({
            userId,
            userEmail,
            type: 'coinbase',
            address: response.data.address, // assuming Coinbase returns an address
        });

        return wallet;
    } catch (error: any) {
        logger.error(`Failed to create Coinbase Smart Wallet: ${error?.response?.data?.message || error.message}`);
        throw error;
    }
}

/**
 * List all wallets for a user
 */
export async function listUserWallets(userId: string) {
    const apiKey = process.env.COINBASE_API_KEY;
    if (!apiKey) {
        logger.error('COINBASE_API_KEY not set in environment');
        throw new Error('Missing Coinbase API configuration');
    }

    const url = `https://api.cdp.coinbase.com/v1/wallets`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        params: {
            user_id: userId,
        },
    });
    return response.data; // Contains list of wallets
}

/**
 * Get transaction history for a wallet
 */
export async function getWalletTransactions(walletId: string) {
    const apiKey = process.env.COINBASE_API_KEY;
    if (!apiKey) {
        logger.error('COINBASE_API_KEY not set in environment');
        throw new Error('Missing Coinbase API configuration');
    }

    const url = `https://api.cdp.coinbase.com/v1/wallets/${walletId}/transactions`;
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data; // Contains wallet transaction history
}

/**
 * Delete a Coinbase Smart Wallet
 */
export async function deleteCoinbaseSmartWallet(walletId: string): Promise<boolean> {
    try {
        const apiKey = process.env.COINBASE_API_KEY;
        if (!apiKey) {
            logger.error('COINBASE_API_KEY not set in environment');
            throw new Error('Missing Coinbase API configuration');
        }

        const url = `https://api.cdp.coinbase.com/v1/wallets/${walletId}`;
        await axios.delete(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        // Remove from cache
        if (walletCache[walletId]) {
            delete walletCache[walletId];
        }

        // Also delete from Redis
        await deleteWallet(walletId);

        logger.info(`Coinbase Smart Wallet deleted: ${walletId}`);
        return true;
    } catch (error: any) {
        logger.error(`Failed to delete Coinbase Smart Wallet: ${walletId} - ${error?.response?.data?.message || error.message}`);
        return false;
    }
}

export const walletService = {
    getWalletInfo,
    createWallet,
    updateWallet,
    deleteWallet,
    getWalletBalance,
    sendTransaction,
    createCoinbaseSmartWallet,
    listUserWallets,
    getWalletTransactions,
    deleteCoinbaseSmartWallet,
};

export default walletService;
