/**
 * Throttle utility to limit the rate of function calls
 */

// Create a Map to store throttle timers for different keys
const throttleTimers = new Map<string, NodeJS.Timeout>();

/**
 * Throttle function calls by key
 * @param key - Unique key for the throttled function
 * @param fn - Function to throttle
 * @param delay - Minimum delay between function calls in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 1000
): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
        if (throttleTimers.has(key)) {
            // Function is already throttled, ignore this call
            return;
        }

        // Execute the function
        fn(...args);

        // Set throttle timer
        const timer = setTimeout(() => {
            throttleTimers.delete(key);
        }, delay);

        throttleTimers.set(key, timer);
    };
}

/**
 * Debounce function calls by key
 * @param key - Unique key for the debounced function  
 * @param fn - Function to debounce
 * @param delay - Delay before function execution in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
        // Clear existing timer
        if (throttleTimers.has(key)) {
            clearTimeout(throttleTimers.get(key)!);
        }

        // Set new timer
        const timer = setTimeout(() => {
            fn(...args);
            throttleTimers.delete(key);
        }, delay);

        throttleTimers.set(key, timer);
    };
}

/**
 * Clear all throttle/debounce timers
 */
export function clearAllThrottles(): void {
    throttleTimers.forEach(timer => clearTimeout(timer));
    throttleTimers.clear();
}
