import { isAddress } from 'ethers/lib/utils';

export const validateTokenAddress = (address: string): boolean => {
    return isAddress(address);
};

export const validateTransferAmount = (amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    return !isNaN(parsedAmount) && parsedAmount > 0;
};

export const validateSessionDuration = (duration: number): boolean => {
    return duration > 0 && duration <= 365 * 24 * 60 * 60; // Duration in seconds
};

export const validateUserInput = (input: string): boolean => {
    return input.trim().length > 0;
};