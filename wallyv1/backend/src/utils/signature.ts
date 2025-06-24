import { recoverMessageAddress, Signature, Hex } from 'viem';

export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
        const recovered = await recoverMessageAddress({ message, signature: signature as Hex | Signature });
        return recovered.toLowerCase() === address.toLowerCase();
    } catch {
        return false;
    }
}
