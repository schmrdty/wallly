import React from 'react';

export const SplashSpinner: React.FC = () => (
  <div className="spinner" style={{
    border: '4px solid #eee',
    borderTop: '4px solid #0070f3',
    borderRadius: '50%',
    width: 40,
    height: 40,
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  }} />
);
