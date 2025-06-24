// Subscription Management Helpers
export const subscriptionManagementHelpers = {
    getCronExpression(metadata: any): string {
        if (metadata.frequency === 'monthly') {
            return `0 0 ${metadata.dayOfMonth || 1} * *`;
        } else {
            return `0 0 ${metadata.dayOfMonth || 1} ${metadata.monthOfYear || 1} *`;
        }
    }
};
