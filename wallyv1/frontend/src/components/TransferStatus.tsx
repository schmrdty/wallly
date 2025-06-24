import React from 'react';

interface TransferStatusProps {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
}

export function TransferStatus({ status, message }: TransferStatusProps) {
  if (status === 'idle') return null;

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`p-3 rounded-md border ${statusStyles[status]}`}>
      <p className="text-sm">{message || `Transfer ${status}`}</p>
    </div>
  );
}

export default TransferStatus;
