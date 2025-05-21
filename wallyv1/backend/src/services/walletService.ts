import { ethers } from 'ethers';
import axios from 'axios';

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
        // TODO: Implement wallet info retrieval from DB or blockchain
        return { id: walletId, info: 'stub' };
    }

    // Example 2: Create a new wallet (could use ethers.js or a custodial service)
    async createWallet(walletData: any) {
        // TODO: Implement wallet creation logic
        return { ...walletData, id: 'stub' };
    }

    // Example 3: Update wallet metadata in DB
    async updateWallet(walletId: string, walletData: any) {
        // TODO: Implement wallet update logic
        return { ...walletData, id: walletId };
    }

    // Example 4: Delete wallet from DB
    async deleteWallet(walletId: string) {
        // TODO: Implement wallet deletion logic
        return true;
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

    // Example 6: List all wallets for a user
    async listUserWallets(userId: string) {
        // TODO: Implement logic to list all wallets for a user
        return [];
    }

    // Example 7: Get wallet transaction history
    async getWalletTransactions(walletId: string) {
        // TODO: Implement logic to fetch wallet transaction history
        return [];
    }
}
