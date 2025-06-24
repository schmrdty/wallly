import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'supersecretkey'; // Use env in production

// Accepts string or number for expiresIn, but must be StringValue (e.g. '7d') or number (seconds)
export function signJwt(payload: object, expiresIn: SignOptions['expiresIn'] = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}