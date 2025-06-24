import { parseUnits, formatUnits } from 'viem';

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateAutoSaveConfig(metadata: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata.thresholdAmount || parseFloat(metadata.thresholdAmount) <= 0) {
        errors.push('Threshold amount must be greater than 0');
    }

    if (!metadata.targetSavingsAddress || !/^0x[a-fA-F0-9]{40}$/.test(metadata.targetSavingsAddress)) {
        errors.push('Invalid target savings address');
    }

    if (!metadata.tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(metadata.tokenAddress)) {
        errors.push('Invalid token address');
    }

    if (!metadata.checkInterval || metadata.checkInterval < 300) {
        warnings.push('Check interval less than 5 minutes may cause high gas costs');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

export async function calculateOptimalThreshold(
    walletAddress: string,
    tokenAddress: string,
    historicalData?: Array<{ amount: string; timestamp: number }>
): Promise<string> {
    // Simple heuristic: 2x average daily spending for the past 30 days
    if (!historicalData || historicalData.length === 0) {
        return '0.1'; // Default 0.1 ETH threshold
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTransactions = historicalData.filter(tx => tx.timestamp > thirtyDaysAgo);

    if (recentTransactions.length === 0) {
        return '0.1';
    }

    const totalSpent = recentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const dailyAverage = totalSpent / 30;
    const optimalThreshold = dailyAverage * 2;

    return optimalThreshold.toString();
}

export function calculateSavingsRate(
    history: Array<{ amount: string; timestamp: number }>
): {
    monthlyRate: string;
    yearlyProjection: string;
    trend: 'increasing' | 'decreasing' | 'stable';
} {
    if (history.length < 2) {
        return {
            monthlyRate: '0',
            yearlyProjection: '0',
            trend: 'stable'
        };
    }

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentSavings = history.filter(save => save.timestamp > thirtyDaysAgo);

    const monthlyTotal = recentSavings.reduce((sum, save) => sum + parseFloat(save.amount), 0);
    const yearlyProjection = monthlyTotal * 12;

    // Calculate trend from last 3 months vs previous 3 months
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    const lastThreeMonths = history.filter(save => save.timestamp > sixtyDaysAgo);
    const previousThreeMonths = history.filter(save => save.timestamp > ninetyDaysAgo && save.timestamp <= sixtyDaysAgo);

    const lastTotal = lastThreeMonths.reduce((sum, save) => sum + parseFloat(save.amount), 0);
    const previousTotal = previousThreeMonths.reduce((sum, save) => sum + parseFloat(save.amount), 0);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (lastTotal > previousTotal * 1.1) trend = 'increasing';
    else if (lastTotal < previousTotal * 0.9) trend = 'decreasing';

    return {
        monthlyRate: monthlyTotal.toString(),
        yearlyProjection: yearlyProjection.toString(),
        trend
    };
}

export function shouldTriggerSaving(
    currentBalance: bigint,
    threshold: bigint,
    minSavingAmount: bigint = BigInt(0)
): boolean {
    const excess = currentBalance - threshold;
    return excess > 0 && excess >= minSavingAmount;
}
