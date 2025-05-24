/**
 * Formats a number as currency.
 * @param amount The amount to format.
 * @param currencySymbol The currency symbol to prepend.
 * @returns Formatted currency string.
 */
export function formatCurrency(amount: number | string, currencySymbol: string = '$'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${currencySymbol}0.00`;
    return `${currencySymbol}${num.toFixed(2)}`;
}

/**
 * Formats a date as a human-readable string.
 * @param date The date to format (Date, number, or string).
 * @returns Formatted date string.
 */
export function formatDate(date: Date | number | string): string {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    let d: Date;
    if (typeof date === 'number') {
        d = new Date(date);
    } else if (typeof date === 'string') {
        d = new Date(Date.parse(date));
    } else if (date instanceof Date) {
        d = date;
    } else {
        return '';
    }
    return d.toLocaleDateString(undefined, options);
}

/**
 * Formats a transaction ID for display (shortened).
 * @param id The transaction ID string.
 * @returns Shortened transaction ID.
 */
export function formatTransactionId(id: string): string {
    if (!id) return '';
    return id.length > 10 ? `${id.slice(0, 5)}...${id.slice(-5)}` : id;
}
