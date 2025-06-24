// Auto-Save Flow Service
import { WallyService } from './wallyService.js';
import { parseUnits, zeroAddress, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { AutoSaveConfig } from '../types/automation.js';

const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL_1)
});

export const autoSaveService = {
    async checkAndExecute(
        config: AutoSaveConfig,
        wallyService: WallyService
    ): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { thresholdAmount, targetSavingsAddress, tokenAddress } = metadata;
        const hasPermission = await wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return false;
        let balance;
        const addressHex = walletAddress as `0x${string}`;
        if (tokenAddress === zeroAddress) {
            balance = await publicClient.getBalance({ address: addressHex });
        } else {
            balance = await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: [{
                    name: 'balanceOf',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [{ name: 'account', type: 'address' }],
                    outputs: [{ name: '', type: 'uint256' }],
                }],
                functionName: 'balanceOf',
                args: [addressHex],
            });
        }
        const threshold = parseUnits(thresholdAmount, 18);
        if (BigInt(balance) > threshold) {
            const transfer = {
                wallet: walletAddress,
                token: tokenAddress,
                recipient: targetSavingsAddress,
                amount: thresholdAmount
            };
            await wallyService.executeTransfer(transfer);
            return true;
        }
        return false;
    }
};
