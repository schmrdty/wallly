export const formatCurrency = (amount, currencySymbol = '$') => {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
};

export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatTransactionId = (id) => {
    return id.length > 10 ? `${id.slice(0, 5)}...${id.slice(-5)}` : id;
};