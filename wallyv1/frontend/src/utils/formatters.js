export const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
};
export function formatDate(date) {
    /** @type {Intl.DateTimeFormatOptions} */
    const options = { year: "numeric", month: "long", day: "numeric" };
    if (typeof date === 'number') {
        date = new Date(date);
    } else if (typeof date === 'string') {
        date = new Date(Date.parse(date));
    }
    return new Date(date).toLocaleDateString(undefined, options);
}

export const formatTransactionId = (id) => {
    return id.length > 10 ? `${id.slice(0, 5)}...${id.slice(-5)}` : id;
};