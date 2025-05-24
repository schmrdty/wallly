import React from 'react';

interface SettingsStatusProps {
  status: string | null;
}

export const SettingsStatus: React.FC<SettingsStatusProps> = ({ status }) =>
  status ? <div>{status}</div> : null;
