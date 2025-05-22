import React, { useEffect, useState } from 'react';

const   SplashPage = ({ onComplete }: { onComplete?: () => void }) => {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contract-expiry', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.expiry) {
          const expiryDate = new Date(data.expiry);
          const now = new Date();
          const diff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff);
        }
      })
      .catch(() => setDaysLeft(null))
      .finally(() => {
        setLoading(false);
        if (onComplete) setTimeout(onComplete, 2000);
      });
  }, [onComplete]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f7fafc'
    }}>
      <img src="/logo.png" alt="Wally Logo" style={{ width: 120, marginBottom: 24 }} />
      <h1 style={{ fontSize: '2.5rem', marginBottom: 16 }}>Wally the Wallet Watcher</h1>
      {loading ? (
        <div>
          <div className="spinner" style={{
            border: '4px solid #eee',
            borderTop: '4px solid #0070f3',
            borderRadius: '50%',
            width: 40,
            height: 40,
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Loading your session...</div>
        </div>
      ) : daysLeft !== null ? (
        <div style={{ fontSize: '1.3rem', margin: '16px 0' }}>
          <strong>{daysLeft}</strong> day{daysLeft === 1 ? '' : 's'} left before contract expiry.
        </div>
      ) : (
        <div style={{ fontSize: '1.1rem', color: '#888', margin: '16px 0' }}>
          Welcome! No active session found.
        </div>
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
};

export default SplashPage;