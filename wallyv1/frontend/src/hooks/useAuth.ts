import { useState } from "react";
import { authenticateWithFarcaster, logoutUser } from "../utils/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginWithFarcaster = async (result: any) => {
    setLoading(true);
    try {
      const session = await authenticateWithFarcaster(result);
      setUser(session.user);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await logoutUser();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  return { user, isAuthenticated, loading, loginWithFarcaster, logout };
};