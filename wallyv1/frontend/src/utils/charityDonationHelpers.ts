// Charity Donation Flow Helpers
export const charityDonationHelpers = {
    formatAmount(amount: string): string {
        return `$${Number(amount).toFixed(2)}`;
    },
    getCategoryIcon(category: string): string {
        const icons: Record<string, string> = {
            poverty: '🍞',
            health: '🏥',
            education: '📚',
            environment: '🌳',
            animals: '🐾',
            technology: '💻',
            water: '💧',
            other: '❤️'
        };
        return icons[category] || '❤️';
    }
};
