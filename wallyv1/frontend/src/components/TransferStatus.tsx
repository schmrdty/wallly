import React from 'react';

interface TransferStatusProps {
    warning?: string;
    status?: string | null;
}

export const TransferStatus: React.FC<TransferStatusProps> = ({ warning, status }) => (
    <>
        {warning && <div style={{ color: 'orange' }}>{warning}</div>}
        {status && (
            <div style={{ marginTop: 8, color: status.includes('failed') ? 'red' : 'green' }}>
                {status}
            </div>
        )}
    </>
);
