import React from 'react';

interface DashboardNavButtonsProps {
  router: any;
}

export const DashboardNavButtons: React.FC<DashboardNavButtonsProps> = ({ router }) => (
  <>
    <button onClick={() => router.push('/Settings')}>Settings</button>
    <button onClick={() => router.push('/Instructions')}>Instructions</button>
  </>
);
