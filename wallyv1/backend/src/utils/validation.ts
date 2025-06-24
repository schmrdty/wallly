import Joi from 'joi';

// User registration validation schema
const userRegistrationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    fid: Joi.number().integer().optional()
});

// User login validation schema
const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Farcaster sign-in validation schema
const farcasterSignInSchema = Joi.object({
    message: Joi.string().required(),
    signature: Joi.string().pattern(/^0x[a-fA-F0-9]+$/).required(),
    fid: Joi.number().integer().optional(),
    username: Joi.string().optional(),
    displayName: Joi.string().optional(),
    pfpUrl: Joi.string().uri().optional(),
    custody: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
    verifications: Joi.array().items(Joi.string()).optional()
});

// SIWE validation schema
const siweSchema = Joi.object({
    message: Joi.string().required(),
    signature: Joi.string().pattern(/^0x[a-fA-F0-9]+$/).required()
});

// Session validation schema
const sessionSchema = Joi.object({
    sessionId: Joi.string().required()
});

export function validateUserRegistration(data: any) {
    return userRegistrationSchema.validate(data);
}

export function validateUserLogin(data: any) {
    return userLoginSchema.validate(data);
}

export function validateFarcasterSignIn(data: any) {
    return farcasterSignInSchema.validate(data);
}

export function validateSiwe(data: any) {
    return siweSchema.validate(data);
}

export function validateSession(data: any) {
    return sessionSchema.validate(data);
}

export default {
    validateUserRegistration,
    validateUserLogin,
    validateFarcasterSignIn,
    validateSiwe,
    validateSession
};
