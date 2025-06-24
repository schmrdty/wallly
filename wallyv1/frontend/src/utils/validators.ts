import { ethers } from 'ethers';

/**
 * Validates an Ethereum token address.
 * @param address The address string to validate.
 * @returns True if valid, false otherwise.
 */
export const validateTokenAddress = (address: string): boolean => {
    return typeof address === 'string' && ethers.isAddress(address);
};

/**
 * Validates a transfer amount (must be a positive number).
 * @param amount The amount string to validate.
 * @returns True if valid, false otherwise.
 */
export const validateTransferAmount = (amount: string): boolean => {
    if (typeof amount !== 'string' || !amount.trim()) return false;
    const parsedAmount = parseFloat(amount);
    return !isNaN(parsedAmount) && parsedAmount > 0;
};

/**
 * Validates a session duration (must be > 0 and <= 1 year in seconds).
 * @param duration The duration in seconds.
 * @returns True if valid, false otherwise.
 */
export const validateSessionDuration = (duration: number): boolean => {
    return typeof duration === 'number' && duration > 0 && duration <= 365 * 24 * 60 * 60;
};

/**
 * Validates generic user input (non-empty after trimming).
 * @param input The input string.
 * @returns True if valid, false otherwise.
 */
export const validateUserInput = (input: string): boolean => {
    return typeof input === 'string' && input.trim().length > 0;
};