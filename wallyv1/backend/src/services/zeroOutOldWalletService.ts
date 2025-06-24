// Zero-Out Old Wallet Service
import { WallyService } from './wallyService.js';
import { ZeroOutConfig } from '../types/automation.js';

export const zeroOutOldWalletService = {
    async zeroOut(config: ZeroOutConfig, wallyService: WallyService): Promise<boolean> {
        const { sourceWallet, targetWallet, excludeTokens } = config.metadata;

        // Get wallet balance for native token
        const nativeBalance = await wallyService.getBalance(sourceWallet);

        const transfers: Array<{
            wallet: string;
            token: string;
            recipient: string;
            amount: string;
        }> = [];

        // Transfer native token if balance > gas reserve
        const gasReserve = BigInt(config.metadata.gasReserve || '0');
        if (nativeBalance > gasReserve) {
            transfers.push({
                wallet: sourceWallet,
                token: '0x0000000000000000000000000000000000000000',
                recipient: targetWallet,
                amount: (nativeBalance - gasReserve).toString()
            });
        }

        // Note: In a real implementation, you would scan for ERC20 tokens
        // and add them to transfers array, excluding any in excludeTokens

        if (transfers.length > 0) {
            await wallyService.executeBatchTransfer(transfers);
            return true;
        }

        return false;
    }
};
