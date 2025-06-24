// Bill Payment Flow Helpers
export const billPaymentHelpers = {
    getDueDate(config: any): Date {
        const now = new Date();
        now.setDate(config.metadata.dueDay || 1);
        return now;
    },
    formatAmount(amount: string): string {
        return `$${Number(amount).toFixed(2)}`;
    }
};
