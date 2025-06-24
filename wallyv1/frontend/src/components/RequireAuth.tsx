import React from 'react';
import { useSession } from '../hooks/useSession.ts';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in to continue.</div>;

  return <>{children}</>;
};

export default RequireAuth;