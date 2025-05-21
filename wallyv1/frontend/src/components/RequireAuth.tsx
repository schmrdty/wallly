import React from "react";
import { useAuth } from "../hooks/useAuth";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in to continue.</div>;

  return children;
};

export default RequireAuth;