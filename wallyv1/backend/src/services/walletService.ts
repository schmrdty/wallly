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
    async getWalletInfo(walletId: string) {
        // TODO: Implement wallet info retrieval
        return { id: walletId, info: 'stub' };
    }
    async createWallet(walletData: any) {
        // TODO: Implement wallet creation
        return { ...walletData, id: 'stub' };
    }
    async updateWallet(walletId: string, walletData: any) {
        // TODO: Implement wallet update
        return { ...walletData, id: walletId };
    }
    async deleteWallet(walletId: string) {
        // TODO: Implement wallet deletion
        return true;
    }

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
}
