import React from 'react';

interface DashboardSignOutButtonsProps {
  user: { authProvider?: string } | null;
  logoutUser: () => void;
}

export const DashboardSignOutButtons: React.FC<DashboardSignOutButtonsProps> = ({ user, logoutUser }) => (
  <div className="flex flex-col gap-3 p-4 bg-white/10 backdrop-blur-md rounded-xl pondWater-font shadow pondWater-btn">
    {user?.authProvider === 'farcaster' && (
      <button className="pondWater-btn" onClick={logoutUser}>Sign out of Farcaster</button>
    )}
    {user?.authProvider === 'ethereum' && (
      <button className="pondWater-btn" onClick={logoutUser}>Sign out of Ethereum</button>
    )}
    {!user?.authProvider && (
      <button className="pondWater-btn" onClick={logoutUser}>Sign out</button>
    )}
  </div>
);
