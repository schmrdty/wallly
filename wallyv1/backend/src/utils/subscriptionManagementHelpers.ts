import { AutomationConfig } from '../types/automation.js';

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateSubscriptionConfig(metadata: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata.serviceName || metadata.serviceName.trim().length === 0) {
        errors.push('Service name is required');
    }

    if (!metadata.recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(metadata.recipientAddress)) {
        errors.push('Invalid recipient address');
    }

    if (!metadata.amount || parseFloat(metadata.amount) <= 0) {
        errors.push('Amount must be greater than 0');
    }

    if (!['monthly', 'yearly'].includes(metadata.frequency)) {
        errors.push('Frequency must be either monthly or yearly');
    }

    if (metadata.dayOfMonth && (metadata.dayOfMonth < 1 || metadata.dayOfMonth > 31)) {
        errors.push('Day of month must be between 1 and 31');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

export function calculateNextPaymentDate(
    frequency: 'monthly' | 'yearly',
    dayOfMonth: number = 1,
    monthOfYear?: number,
    fromDate: Date = new Date()
): number {
    const now = new Date(fromDate);
    let nextPayment: Date;

    if (frequency === 'monthly') {
        nextPayment = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

        // If the day has already passed this month, move to next month
        if (nextPayment <= now) {
            nextPayment = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
        }
    } else {
        // Yearly
        const targetMonth = monthOfYear ? monthOfYear - 1 : now.getMonth();
        nextPayment = new Date(now.getFullYear(), targetMonth, dayOfMonth);

        // If the date has already passed this year, move to next year
        if (nextPayment <= now) {
            nextPayment = new Date(now.getFullYear() + 1, targetMonth, dayOfMonth);
        }
    }

    return nextPayment.getTime();
}

export function checkSubscriptionHealth(
    config: AutomationConfig,
    walletBalance: string
): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
} {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const balance = parseFloat(walletBalance);
    const amount = parseFloat(config.metadata.amount);

    // Check if wallet has sufficient balance for next payment
    if (balance < amount) {
        issues.push('Insufficient balance for next payment');
        recommendations.push(`Add at least ${(amount - balance).toFixed(4)} to wallet`);
    }

    // Check if wallet has balance for next 3 payments (buffer)
    if (balance < amount * 3) {
        issues.push('Low balance warning');
        recommendations.push('Consider adding more funds for future payments');
    }

    // Check if permission is expiring soon (within 7 days)
    const now = Date.now();
    const nextPayment = config.metadata.nextPaymentDate;
    if (nextPayment && nextPayment - now < 7 * 24 * 60 * 60 * 1000) {
        issues.push('Permission expires soon');
        recommendations.push('Renew wallet permissions before next payment');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (balance < amount) status = 'critical';
    else if (issues.length > 0) status = 'warning';

    return { status, issues, recommendations };
}

export function calculateSubscriptionCost(
    amount: string,
    frequency: 'monthly' | 'yearly',
    period: 'monthly' | 'yearly'
): string {
    const baseAmount = parseFloat(amount);

    if (frequency === period) {
        return amount;
    }

    if (frequency === 'monthly' && period === 'yearly') {
        return (baseAmount * 12).toString();
    }

    if (frequency === 'yearly' && period === 'monthly') {
        return (baseAmount / 12).toString();
    }

    return amount;
}

export function groupSubscriptionsByCategory(
    subscriptions: AutomationConfig[]
): Map<string, AutomationConfig[]> {
    const categories = new Map<string, AutomationConfig[]>();

    // Define common service categories
    const categoryMap: { [key: string]: string } = {
        'netflix': 'Entertainment',
        'spotify': 'Entertainment',
        'hulu': 'Entertainment',
        'amazon': 'Shopping',
        'github': 'Development',
        'notion': 'Productivity',
        'figma': 'Design',
        'adobe': 'Design',
        'google': 'Productivity',
        'microsoft': 'Productivity'
    };

    subscriptions.forEach(sub => {
        const serviceName = sub.metadata.serviceName?.toLowerCase() || '';
        let category = 'Other';

        // Try to categorize based on service name
        for (const [service, cat] of Object.entries(categoryMap)) {
            if (serviceName.includes(service)) {
                category = cat;
                break;
            }
        }

        if (!categories.has(category)) {
            categories.set(category, []);
        }
        categories.get(category)!.push(sub);
    });

    return categories;
}
