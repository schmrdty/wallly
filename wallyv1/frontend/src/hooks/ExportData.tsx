import React, { useState } from 'react';
import { exportUserData } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const ExportData: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await exportUserData(user?.id);
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user_data_${user?.id || 'export'}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setSuccess('Data exported successfully!');
        } catch (err) {
            setError('Failed to export data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Export User Data</h2>
            <button onClick={handleExport} disabled={loading || !user}>
                {loading ? 'Exporting...' : 'Export Data'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
};

export default ExportData;