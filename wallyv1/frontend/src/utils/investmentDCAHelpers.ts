// Investment DCA Helpers
export const investmentDCAHelpers = {
    getFrequencyMs(frequency: string): number {
        switch (frequency) {
            case 'daily': return 86400000;
            case 'weekly': return 604800000;
            case 'biweekly': return 1209600000;
            case 'monthly': return 2592000000;
            default: return 86400000;
        }
    },
    formatAmount(amount: string): string {
        return `${Number(amount).toLocaleString()} tokens`;
    }
};
