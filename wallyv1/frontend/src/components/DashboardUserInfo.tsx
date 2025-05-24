import React from 'react';

interface DashboardUserInfoProps {
  user: { id: string } | null;
  isValid: boolean;
}

export const DashboardUserInfo: React.FC<DashboardUserInfoProps> = ({ user, isValid }) => (
  <div className="user-info">
    <h2>User Info</h2>
    <div>
      <p>User ID: {user?.id}</p>
      <p>Session Valid: {isValid ? 'Yes' : 'No'}</p>
    </div>
  </div>
);
