import { ethers } from 'ethers';

export function verifySignature(address: string, message: string, signature: string): boolean {
    try {
        const recovered = ethers.utils.verifyMessage(message, signature);
        return recovered.toLowerCase() === address.toLowerCase();
    } catch {
        return false;
    }
}