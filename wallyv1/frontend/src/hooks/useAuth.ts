import { useState, useEffect } from "react";
import { AuthUser } from "../types/user";
import { authenticateWithFarcaster, logout } from "../utils/api";

/**
 * Custom hook for authentication state and actions.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (stored) {
      setUser(JSON.parse(stored));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    }
  }, [user]);

  /**
   * Called by FarcasterSignIn on success.
   */
  const signInWithFarcaster = (userData: any) => {
    setUser({ ...userData, authProvider: "farcaster" });
    setError(null);
  };

  /**
   * Called by Auth.tsx (SIWE) on success.
   */
  const signInWithEthereum = (userData: any) => {
    setUser({ ...userData, authProvider: "ethereum" });
    setError(null);
  };

  /**
   * Login with Farcaster, handles API and error state.
   */
  const loginWithFarcaster = async (result: any) => {
    setLoading(true);
    setError(null);
    try {
      const session = await authenticateWithFarcaster(result);
      setUser({ ...session.user, authProvider: "farcaster" });
      setIsAuthenticated(true);
    } catch (err: any) {
      setIsAuthenticated(false);
      setUser(null);
      setError(err?.message || "Farcaster login failed");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and clear state.
   */
  const logoutUser = async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      setError(err?.message || "Logout failed");
    }
    setLoading(false);
  };

  return {
    user,
    setUser,
    isAuthenticated,
    loading,
    error,
    loginWithFarcaster,
    logoutUser,
    signInWithFarcaster,
    signInWithEthereum,
  };
}