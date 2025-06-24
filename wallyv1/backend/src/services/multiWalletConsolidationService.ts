// Multi-Wallet Consolidation Service
import { WallyService } from './wallyService.js';
import { ConsolidationConfig, TransferRequest } from '../types/automation.js';
import { createPublicClient, http, parseUnits } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
    chain: base,
    transport: http(process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL_1)
});

export const multiWalletConsolidationService = {
    async consolidate(config: ConsolidationConfig, wallyService: WallyService): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { sourceWallets, targetWallet, minThreshold, tokenFilter } = metadata; const hasPermission = await wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return false;

        const transfers: TransferRequest[] = [];
        const minThresholdBigInt = parseUnits(minThreshold, 18);

        // Check each source wallet for consolidation
        for (const sourceWallet of sourceWallets) {
            try {
                // Get native balance
                const nativeBalance = await publicClient.getBalance({
                    address: sourceWallet as `0x${string}`
                });

                // Only transfer if above threshold
                if (nativeBalance > minThresholdBigInt) {
                    const gasReserve = parseUnits('0.001', 18); // Reserve for gas
                    const transferAmount = nativeBalance - gasReserve;

                    if (transferAmount > 0) {
                        transfers.push({
                            wallet: sourceWallet,
                            token: '0x0000000000000000000000000000000000000000',
                            recipient: targetWallet,
                            amount: transferAmount.toString()
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing wallet ${sourceWallet}:`, error);
                continue;
            }
        }

        // Execute transfers
        if (transfers.length > 0) {
            if (transfers.length === 1) {
                await wallyService.executeTransfer(transfers[0]);
            } else {
                await wallyService.executeBatchTransfer(transfers);
            }
            return true;
        }

        return false;
    }
};
