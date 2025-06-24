import React from 'react';

interface SettingsStatusProps {
  status: string | null;
}

const SettingsStatus: React.FC<SettingsStatusProps> = ({ status }) =>
  status ? <div>{status}</div> : null;

export default SettingsStatus;
