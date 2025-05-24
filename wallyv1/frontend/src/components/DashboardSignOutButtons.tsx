import React from 'react';

interface DashboardSignOutButtonsProps {
  user: { authProvider?: string } | null;
  logoutUser: () => void;
}

export const DashboardSignOutButtons: React.FC<DashboardSignOutButtonsProps> = ({ user, logoutUser }) => (
  <>
    {user?.authProvider === 'farcaster' && (
      <button onClick={logoutUser}>Sign out of Farcaster</button>
    )}
    {user?.authProvider === 'ethereum' && (
      <button onClick={logoutUser}>Sign out of Ethereum</button>
    )}
    {!user?.authProvider && (
      <button onClick={logoutUser}>Sign out</button>
    )}
  </>
);
