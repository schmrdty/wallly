/**
 * Comprehensive Farcaster Authentication Debug Utility
 * 
 * This utility provides real-time debugging and validation of the entire
 * Farcaster authentication flow from AuthKit to session persistence.
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { sessionService } from '../services/sessionService.js';
import { verifySiwfMessage, getFarcasterNonce } from './farcasterVerify.js';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

// Define proper interfaces
interface DebugCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp?: string;
}

interface DebugReport {
  timestamp: string;
  checks: DebugCheckResult[];
  recommendations: string[];
  summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface ValidationResult {
  valid: boolean;
  fid?: number;
  message?: string;
  error?: string;
  details?: any;
}

// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Generate comprehensive debug report
 */
export async function generateDebugReport(sessionId?: string): Promise<DebugReport> {
  const report = {
    timestamp: new Date().toISOString(),
    sessionId,
    checks: [] as any[],
    recommendations: [] as string[]
  };

  try {
    // Test nonce generation
    try {
      const nonce = getFarcasterNonce();
      report.checks.push({ test: 'nonce_generation', status: 'pass', nonce });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      report.checks.push({ test: 'nonce_generation', status: 'fail', error: errorMessage });
      report.recommendations.push(`Nonce generation failed: ${errorMessage}`);
    }

    // Test session operations
    if (sessionId) {
      try {
        const session = await sessionService.getSession(sessionId);
        report.checks.push({ test: 'session_retrieval', status: session ? 'pass' : 'fail', session });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        report.checks.push({ test: 'session_retrieval', status: 'fail', error: errorMessage });
        report.recommendations.push(`Session creation/retrieval failed: ${errorMessage}`);
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    report.recommendations.push(`Debug report generation failed: ${errorMessage}`);
  }

  return report;
}

/**
 * API endpoint for debug report
 */
export const getDebugReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await generateDebugReport();
    res.json(report);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Validate Farcaster message with real-time debugging
 */
export async function validateFarcasterMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message, signature, nonce } = req.body;

    if (!message || !signature) {
      res.status(400).json({
        valid: false,
        error: 'Missing required fields: message, signature'
      });
      return;
    }

    // Fix: Pass as object parameter
    const result = await verifySiwfMessage({
      message,
      signature,
      nonce
    });

    res.json({
      valid: true,
      fid: result.fid,
      message: 'Validation successful',
      details: result
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(`❌ Validation error: ${errorMessage}`);

    res.status(400).json({
      valid: false,
      error: errorMessage
    });
  }
}

/**
 * Test Farcaster authentication with real-time debugging
 */
export const debugFarcasterAuth = async (req: Request, res: Response): Promise<void> => {
  const debugLog: string[] = [];
  const logStep = (step: string) => {
    debugLog.push(`${new Date().toISOString()}: ${step}`);
    logger.info(`[DEBUG AUTH] ${step}`);
  };

  try {
    const {
      message,
      signature,
      fid,
      username,
      displayName,
      pfpUrl,
      custody,
      verifications
    } = req.body;

    logStep('=== STARTING FARCASTER AUTH DEBUG ===');
    logStep(`Input FID: ${fid}`);
    logStep(`Input username: ${username}`);
    logStep(`Input custody: ${custody}`);
    logStep(`Message length: ${message?.length || 0}`);
    logStep(`Signature length: ${signature?.length || 0}`);

    // Validate required fields
    if (!message || !signature) {
      logStep('❌ Missing message or signature');
      res.status(400).json({
        error: 'Missing message or signature',
        debugLog
      });
      return;
    }

    logStep('✅ Required fields present');

    // Check Redis connection
    logStep(`Redis connected: ${redisClient.isConnected()}`);
    if (!redisClient.isConnected()) {
      logStep('❌ Redis not connected - session storage will fail');
    }

    // Generate domain
    const domain = process.env.NODE_ENV === 'development' ? 'localhost:3000' : (process.env.NEXT_PUBLIC_DOMAIN || 'wally.schmidtiest.xyz');
    logStep(`Using domain: ${domain}`);

    // Test nonce extraction
    const nonceMatch = message.match(/Nonce: ([^\n]+)/);
    const extractedNonce = nonceMatch ? nonceMatch[1] : null;
    logStep(`Extracted nonce: ${extractedNonce}`);

    // Verify SIWF message - fix: use correct single parameter
    logStep('Starting SIWF verification...');
    const verifyStartTime = Date.now();

    const result = await verifySiwfMessage({
      message,
      signature,
      domain,
      nonce: extractedNonce
    });

    const verifyDuration = Date.now() - verifyStartTime;
    logStep(`SIWF verification completed in ${verifyDuration}ms`);
    logStep(`Verification success: ${result.success}`);

    if (result.error) {
      const errorMessage = getErrorMessage(result.error);
      logStep(`Verification error: ${errorMessage}`);
    } else {
      logStep('Verification error: none');
    }

    if (!result.success || result.isError) {
      logStep('❌ SIWF verification failed');
      const errorMessage = result.error ? getErrorMessage(result.error) : 'Unknown verification error';
      res.status(401).json({
        error: 'Invalid Farcaster signature',
        details: errorMessage,
        debugLog
      });
      return;
    }

    logStep('✅ SIWF verification successful');

    // Extract FID and address
    const verifiedFid = result.fid || fid;
    const verifiedAddress = result.data?.address || custody;

    logStep(`Verified FID: ${verifiedFid}`);
    logStep(`Verified address: ${verifiedAddress}`);

    if (!verifiedFid) {
      logStep('❌ No FID found in verification result');
      res.status(400).json({
        error: 'No FID found in verification result',
        debugLog
      });
      return;
    }

    // Create session - fix: use correct parameters
    logStep('Creating session...');
    const sessionStartTime = Date.now();

    // Fix: createSession expects (sessionType, userData)
    const session = await sessionService.createSession('farcaster', {
      id: verifiedFid.toString(),
      address: verifiedAddress,
      fid: verifiedFid,
      username,
      displayName,
      pfpUrl,
      authProvider: 'farcaster',
      custody,
      verifications
    });

    const sessionDuration = Date.now() - sessionStartTime;
    logStep(`Session created in ${sessionDuration}ms`);
    logStep(`Session ID: ${session.sessionId}`);
    logStep(`Session expires: ${new Date(session.expiresAt).toISOString()}`);

    // Verify session was stored
    logStep('Verifying session storage...');
    const storedSession = await sessionService.getSession(session.sessionId);

    if (storedSession) {
      logStep('✅ Session successfully stored and retrieved');
    } else {
      logStep('❌ Session was not properly stored');
    }

    // Create user object
    const user = {
      id: verifiedFid.toString(),
      fid: parseInt(verifiedFid.toString()),
      username,
      displayName,
      pfpUrl,
      address: verifiedAddress || custody || `farcaster:${verifiedFid}`,
      authProvider: 'farcaster',
      custody,
      verifications,
    };

    logStep('✅ Authentication completed successfully');
    logStep('=== FARCASTER AUTH DEBUG COMPLETE ===');

    res.json({
      sessionId: session.sessionId,
      user,
      debugLog,
      timing: {
        verificationMs: verifyDuration,
        sessionCreationMs: sessionDuration
      }
    });

  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    logStep(`❌ Fatal error: ${errorMessage}`);
    logStep('=== FARCASTER AUTH DEBUG FAILED ===');

    logger.error('Debug Farcaster auth error', err);
    res.status(500).json({
      error: errorMessage,
      debugLog
    });
  }
};

/**
 * Validate existing session with debugging
 */
export const debugSessionValidation = async (req: Request, res: Response): Promise<void> => {
  const debugLog: string[] = [];
  const logStep = (step: string) => {
    debugLog.push(`${new Date().toISOString()}: ${step}`);
    logger.info(`[DEBUG SESSION] ${step}`);
  };

  try {
    const { sessionId } = req.params;

    logStep('=== STARTING SESSION VALIDATION DEBUG ===');
    logStep(`Session ID: ${sessionId}`);

    // Check Redis connection
    logStep(`Redis connected: ${redisClient.isConnected()}`);

    // Check if session exists in Redis
    if (redisClient.isConnected()) {
      const sessionData = await redisClient.get(`session:${sessionId}`);
      logStep(`Session data exists in Redis: ${!!sessionData}`);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        logStep(`Session user: ${session.userAddress}`);
        logStep(`Session created: ${new Date(session.createdAt).toISOString()}`);
        logStep(`Session expires: ${new Date(session.expiresAt).toISOString()}`);
        logStep(`Session revoked: ${session.revoked}`);

        const now = Date.now();
        const isExpired = now > session.expiresAt;
        logStep(`Session expired: ${isExpired}`);
      }
    }

    // Use sessionService validation
    logStep('Testing sessionService validation...');
    const isValid = await sessionService.validateSession(sessionId);
    logStep(`SessionService validation result: ${isValid}`);

    // Get session details
    const session = await sessionService.getSession(sessionId);
    logStep(`SessionService getSession result: ${!!session}`);

    logStep('=== SESSION VALIDATION DEBUG COMPLETE ===');

    res.json({
      sessionId,
      isValid,
      session: session ? {
        userAddress: session.userAddress,
        createdAt: new Date(session.createdAt).toISOString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
        revoked: !session.isValid // Use negation of isValid to indicate revoked status
      } : null,
      debugLog
    });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logStep(`❌ Validation error: ${errorMessage}`);
    logger.error('Debug session validation error', error);
    res.status(500).json({
      error: errorMessage,
      debugLog
    });
  }
};

/**
 * Clear all sessions (for debugging)
 */
export const debugClearAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!redisClient.isConnected()) {
      res.status(500).json({ error: 'Redis not connected' });
      return;
    }

    const sessionKeys = await redisClient.keys('session:*');
    const userSessionKeys = await redisClient.keys('userSession:*');

    const allKeys = [...sessionKeys, ...userSessionKeys];

    if (allKeys.length > 0) {
      // Fix: del expects individual keys or an array, not spread
      for (const key of allKeys) {
        await redisClient.del(key);
      }
    }

    logger.info(`Debug: Cleared ${allKeys.length} session keys`);

    res.json({
      message: `Cleared ${allKeys.length} session keys`,
      sessionKeys: sessionKeys.length,
      userSessionKeys: userSessionKeys.length
    });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logger.error('Debug clear sessions error', error);
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Additional debug utilities
 */
export async function testFarcasterComponents(): Promise<DebugReport> {
  return generateDebugReport();
}

export function createDebugMiddleware() {
  return async (req: Request, res: Response, next: any) => {
    if (req.query.debug === 'true') {
      const report = await generateDebugReport();
      res.json(report);
      return;
    }
    next();
  };
}
