// Emergency Fund Helpers
export const emergencyFundHelpers = {
    getStatusColor(status: string): string {
        switch (status) {
            case 'healthy': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            case 'critical': return 'text-red-500';
            default: return 'text-gray-500';
        }
    },
    formatAmount(amount: string): string {
        return `${Number(amount).toLocaleString()} tokens`;
    }
};
