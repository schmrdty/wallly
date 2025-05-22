import { ethers } from 'ethers';
import axios from 'axios';
import { Wallet } from '../models/Wallet'; // Example ORM model
import { logError } from '../infra/mon/logger';

export const getWalletBalance = async (walletAddress: string, providerUrl: string): Promise<string> => {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const balance = await provider.getBalance(walletAddress);
    return ethers.utils.formatEther(balance);
};

export const sendTransaction = async (privateKey: string, to: string, value: string, providerUrl: string): Promise<string> => {
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const tx = await wallet.sendTransaction({ to, value: ethers.utils.parseEther(value) });
    await tx.wait();
    return tx.hash;
};

export class WalletService {
    // Example 1: Retrieve wallet info from DB or blockchain
    async getWalletInfo(walletId: string) {
        try {
            const wallet = await Wallet.findByPk(walletId);
            if (!wallet) throw new Error('Wallet not found');
            return wallet;
        } catch (err) {
            logError('getWalletInfo failed', err);
            throw err;
        }
    }

    // Example 2: Create a new wallet (could use ethers.js or a custodial service)
    async createWallet(walletData: any) {
        try {
            const wallet = await Wallet.create(walletData);
            return wallet;
        } catch (err) {
            logError('createWallet failed', err);
            throw err;
        }
    }

    // Example 3: Update wallet metadata in DB
    async updateWallet(walletId: string, walletData: any) {
        try {
            const wallet = await Wallet.findByPk(walletId);
            if (!wallet) throw new Error('Wallet not found');
            await wallet.update(walletData);
            return wallet;
        } catch (err) {
            logError('updateWallet failed', err);
            throw err;
        }
    }

    // Example 4: Delete wallet from DB
    async deleteWallet(walletId: string) {
        try {
            const wallet = await Wallet.findByPk(walletId);
            if (!wallet) throw new Error('Wallet not found');
            await wallet.destroy();
            return true;
        } catch (err) {
            logError('deleteWallet failed', err);
            throw err;
        }
    }

    // Example 5: Create a Coinbase Smart Wallet via API
    async createCoinbaseSmartWallet(userId: string, userEmail: string) {
        const apiKey = process.env.COINBASE_API_KEY;
        const url = 'https://api.cdp.coinbase.com/v1/wallets';

        const response = await axios.post(
            url,
            {
                user_id: userId,
                email: userEmail,
                // Add any other required fields per Coinbase API docs
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data; // Contains wallet address, etc.
    }

    // -- List all wallets for a user
    async listUserWallets(userId: string) {
        const apiKey = process.env.COINBASE_API_KEY;
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

    async getWalletTransactions(walletId: string) {
        const apiKey = process.env.COINBASE_API_KEY;
        const url = `https://api.cdp.coinbase.com/v1/wallets/${walletId}/transactions`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data; // Contains wallet transaction history
    }
}
