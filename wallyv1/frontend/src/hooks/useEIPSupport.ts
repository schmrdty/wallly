import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export interface TemporaryCodeInfo {
  active: boolean;
  codeHash: string;
  expiresAt: number;
}

export interface WalletPermissions {
  methods: string[];
  expiresAt: number;
  active: boolean;
}

export interface EIP7702Result {
  success: boolean;
  transactionHash?: string;
  result?: any;
  error?: any;
}

export interface EIP5792Result {
  success: boolean;
  transactionHash?: string;
  signature?: string;
  result?: any;
  error?: any;
}

/**
 * React hook for EIP-7702 and EIP-5792 functionality
 * Provides functions for temporary contract code execution and wallet API operations
 */
export function useEIPSupport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- EIP-7702: Temporary Contract Code Functions ---

  const setTemporaryCode = useCallback(async (
    account: string,
    codeHash: string,
    expiresAt: string,
    nonce: string,
    signature: string
  ): Promise<EIP7702Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip7702/setTemporaryCode', {
        account,
        codeHash,
        expiresAt,
        nonce,
        signature
      });
      return { success: true, transactionHash: response.data.transactionHash };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to set temporary code';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetTemporaryCode = useCallback(async (account: string): Promise<EIP7702Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip7702/resetTemporaryCode', { account });
      return { success: true, transactionHash: response.data.transactionHash };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to reset temporary code';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const executeWithTemporaryCode = useCallback(async (
    account: string,
    target: string,
    data: string,
    value?: string
  ): Promise<EIP7702Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip7702/executeWithTemporaryCode', {
        account,
        target,
        data,
        value: value || '0'
      });
      return { 
        success: true, 
        transactionHash: response.data.transactionHash,
        result: response.data.result 
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to execute with temporary code';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemporaryCode = useCallback(async (account: string): Promise<TemporaryCodeInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/eip7702/getTemporaryCode/${account}`);
      return {
        active: response.data.active,
        codeHash: response.data.codeHash,
        expiresAt: response.data.expiresAt
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to get temporary code info';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- EIP-5792: Wallet API Functions ---

  const requestWalletPermissions = useCallback(async (
    account: string,
    methods: string[],
    expiresAt: string,
    nonce: string,
    signature: string
  ): Promise<EIP5792Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip5792/wallet_requestPermissions', {
        account,
        methods,
        expiresAt,
        nonce,
        signature
      });
      return { success: true, transactionHash: response.data.transactionHash };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to request wallet permissions';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const getWalletPermissions = useCallback(async (account: string): Promise<WalletPermissions | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/eip5792/wallet_getPermissions/${account}`);
      return {
        methods: response.data.methods,
        expiresAt: response.data.expiresAt,
        active: response.data.active
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to get wallet permissions';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTransaction = useCallback(async (
    account: string,
    to: string,
    value?: string,
    data?: string
  ): Promise<EIP5792Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip5792/eth_sendTransaction', {
        account,
        to,
        value: value || '0',
        data: data || '0x'
      });
      return { 
        success: true, 
        transactionHash: response.data.transactionHash,
        result: response.data.result 
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to send transaction';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const signData = useCallback(async (
    account: string,
    dataHash: string
  ): Promise<EIP5792Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip5792/eth_sign', {
        account,
        dataHash
      });
      return { success: true, signature: response.data.signature };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to sign data';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeWalletPermissions = useCallback(async (account: string): Promise<EIP5792Result> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/eip5792/wallet_revokePermissions', { account });
      return { success: true, transactionHash: response.data.transactionHash };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Failed to revoke wallet permissions';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    
    // EIP-7702 functions
    setTemporaryCode,
    resetTemporaryCode,
    executeWithTemporaryCode,
    getTemporaryCode,
    
    // EIP-5792 functions
    requestWalletPermissions,
    getWalletPermissions,
    sendTransaction,
    signData,
    revokeWalletPermissions
  };
}