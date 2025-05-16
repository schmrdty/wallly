import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
};

export default RequireAuth;