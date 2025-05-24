import React from "react";
import { useAuth } from "../hooks/useAuth";

interface RequireAuthProps {
  children?: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in to continue.</div>;
  if (isAuthenticated && !children) {
    return <div>Access Denied: No content available.</div>;
  }
  if (isAuthenticated && children) {
    return <div>{children}</div>;
  }

  return null;
};

export default RequireAuth;