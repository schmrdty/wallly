// Investment DCA Service
import { WallyService } from './wallyService.js';
import { DCAConfig } from '../types/automation.js';

export const investmentDCAService = {
    async executeDCA(config: DCAConfig, wallyService: WallyService): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { sourceToken, targetToken, amount, exchangeAddress, slippageTolerance } = metadata;

        const hasPermission = await wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return false;

        try {
            // Check if wallet has sufficient balance
            const balance = await wallyService.getBalance(walletAddress, sourceToken);
            const requiredAmount = BigInt(amount);

            if (balance < requiredAmount) {
                console.log('Insufficient balance for DCA execution');
                return false;
            }

            // For now, execute a simple transfer to exchange
            // In production, this would integrate with DEX protocols like Uniswap
            const transfer = {
                wallet: walletAddress,
                token: sourceToken,
                recipient: exchangeAddress,
                amount: amount
            };

            await wallyService.executeTransfer(transfer);

            // Update execution metrics
            config.metadata.executionTimes.push(Date.now());
            const currentInvested = parseFloat(config.metadata.totalInvested) + parseFloat(amount);
            config.metadata.totalInvested = currentInvested.toString();

            return true;
        } catch (error) {
            console.error('DCA execution failed:', error);
            return false;
        }
    },

    async calculateOptimalAmount(config: DCAConfig): Promise<string> {
        // Simple heuristic for DCA amount optimization
        const { frequency, totalInvested } = config.metadata;
        const monthlyBudget = parseFloat(totalInvested) / 12;

        switch (frequency) {
            case 'daily':
                return (monthlyBudget / 30).toString();
            case 'weekly':
                return (monthlyBudget / 4).toString();
            case 'biweekly':
                return (monthlyBudget / 2).toString();
            case 'monthly':
                return monthlyBudget.toString();
            default:
                return config.metadata.amount;
        }
    }
};
