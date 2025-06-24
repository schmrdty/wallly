import { useSignIn, useProfile } from '@farcaster/auth-kit';
import { logger } from '../utils/logger';
import { useEffect, useState, useCallback } from 'react';
import { useSessionContext } from '../context/SessionContext';
import { api } from '../utils/api';

export interface UseFarcasterAuthReturn {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  user: any;
  signIn: () => void;
  url?: string;
  profileData?: any;
}

export const useFarcasterAuth = (): UseFarcasterAuthReturn => {
  const [isClient, setIsClient] = useState(false);
  const [backendLoading, setBackendLoading] = useState(false);
  const [hasCreatedSession, setHasCreatedSession] = useState(false);
  const { setSession } = useSessionContext();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle successful Farcaster authentication by creating backend session
  const handleFarcasterSuccess = useCallback(async (result: any) => {
    try {
      setBackendLoading(true);
      console.log('🎯 Farcaster Auth Success - Full Result Object:');
      console.log(JSON.stringify(result, null, 2));

      // Extract the SIWF (Sign-In With Farcaster) data from Auth Kit result
      // Be more resilient with missing data
      const authData = {
        message: result.message || 'Farcaster Auth Kit Sign-In',
        signature: result.signature || 'profile-based-auth',
        fid: result.fid || null,
        username: result.username || '',
        displayName: result.displayName || result.username || '',
        pfpUrl: result.pfpUrl || '',
        custody: result.custody || '',
        verifications: result.verifications || []
      };

      console.log('🔄 Sending to backend - Auth Data:');
      console.log(JSON.stringify(authData, null, 2));

      // Only proceed if we have at least one identifying piece of information
      if (!authData.fid && !authData.username && !authData.custody) {
        throw new Error('Missing required Farcaster identification data');
      }

      // Call backend to create session with Farcaster data
      const response = await api.post('/api/auth/farcaster', authData);
      if (response.data?.token) {
        localStorage.setItem('jwt', response.data.token);
      }
      if (response.data?.sessionId && response.data?.user) {
        // Create session in frontend context
        setSession(response.data.sessionId, response.data.user);
        setHasCreatedSession(true);
        console.log('✅ Backend session created:', response.data.sessionId);
        logger.info('Farcaster backend session created', {
          sessionId: response.data.sessionId,
          userId: response.data.user.id
        });
      } else {
        throw new Error('Invalid response from backend');
      }
    } catch (error: any) {
      console.error('❌ Failed to create backend session - Full Error:');
      console.error(error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Error status:', error?.response?.status);

      // If backend is unreachable, create a client-side session to prevent infinite retry
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ERR_SSL_PROTOCOL_ERROR' || error?.response?.status >= 500) {
        console.warn('🔄 Backend unreachable, creating client-side session for UX');

        // Create a temporary session client-side to prevent infinite polling
        const tempUser = {
          id: result.fid?.toString() || 'temp-user',
          fid: result.fid,
          username: result.username,
          displayName: result.displayName,
          pfpUrl: result.pfpUrl,
          address: result.custody || '',
          authProvider: 'farcaster',
          custody: result.custody,
          verifications: result.verifications || []
        };

        setSession('temp-session', tempUser);
        setHasCreatedSession(true);
        console.log('⚠️ Created temporary client-side session due to backend issues');
      }

      logger.error('Farcaster backend session creation failed', error);
      // Don't throw here - let the user stay "authenticated" with Farcaster even if backend fails
    } finally {
      setBackendLoading(false);
    }
  }, [setSession]);

  const {
    signIn,
    isSuccess,
    isError,
    error,
    url,
    data: signInData,
  } = useSignIn({
    onSuccess: handleFarcasterSuccess,
  });

  const { isAuthenticated, profile } = useProfile();

  // Auto-trigger session creation when profile becomes available but session hasn't been created yet
  // Add additional checks to prevent infinite loops
  useEffect(() => {
    if (isAuthenticated && profile && !hasCreatedSession && !backendLoading && !isError) {
      console.log('🔄 Profile available, creating backend session automatically...');
      console.log('📊 Profile data:', profile);

      // Prevent multiple attempts for the same profile
      const profileKey = `${profile.fid}-${profile.username}`;
      const lastAttempt = sessionStorage.getItem(`farcaster-auth-attempt-${profileKey}`);
      const now = Date.now();

      // Only retry after 30 seconds to prevent infinite loops
      if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
        console.log('🚫 Skipping auth attempt - too recent');
        return;
      }

      sessionStorage.setItem(`farcaster-auth-attempt-${profileKey}`, now.toString());

      // Create result object from profile data for backend session creation
      const profileResult = {
        fid: profile.fid || null,
        username: profile.username || '',
        displayName: profile.displayName || profile.username || '',
        pfpUrl: profile.pfpUrl || '',
        custody: profile.custody || '',
        verifications: profile.verifications || [],
        message: 'Farcaster Auth Kit Profile Session',
        signature: 'profile-based-auth' // Backend will accept this for Auth Kit
      };

      // Only proceed if we have at least some identification data
      if (!profileResult.fid && !profileResult.username && !profileResult.custody) {
        console.warn('🚫 Profile missing required identification data');
        return;
      }

      handleFarcasterSuccess(profileResult);
    }
  }, [isAuthenticated, profile, hasCreatedSession, backendLoading, isError, handleFarcasterSuccess]);

  // Don't process auth on server side
  if (!isClient) {
    return {
      isLoading: false,
      isAuthenticated: false,
      error: null,
      user: null,
      signIn: () => { },
      url: undefined,
      profileData: null,
    };
  }

  if (isError) {
    let friendlyError = null;
    if (typeof error === 'object' && error?.message) {
      if (error.message.includes('keyDataOf') && error.message.includes('no data')) {
        friendlyError = 'Your Farcaster account could not be verified onchain. Please ensure your FID and custody address are registered and try again.';
      } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('rpc')) {
        friendlyError = 'Network error during Farcaster authentication. Please try again later.';
      }
    }
    logger.error('FarcasterAuthError', { error });
    return {
      isLoading: !isSuccess && !isError || backendLoading,
      isAuthenticated: isAuthenticated || false,
      error: friendlyError || (typeof error === 'string' ? error : error?.message || 'Authentication failed'),
      user: profile || signInData,
      signIn,
      url,
      profileData: profile,
    };
  }

  return {
    isLoading: !isSuccess && !isError || backendLoading,
    isAuthenticated: isAuthenticated || false,
    error: isError ? (typeof error === 'string' ? error : error?.message || 'Authentication failed') : null,
    user: profile || signInData,
    signIn,
    url,
    profileData: profile,
  };
};

export default useFarcasterAuth;