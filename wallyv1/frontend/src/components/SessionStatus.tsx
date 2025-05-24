import React from 'react';

interface SessionStatusProps {
  status: string;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({ status }) =>
  status ? <div style={{ marginTop: 8 }}>{status}</div> : null;
