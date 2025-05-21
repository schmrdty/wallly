import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { useAuth } from '../src/hooks/useAuth';

const SplashPage = ({ onComplete }: { onComplete?: () => void }) => {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const userId = user?.id;

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
        if (onComplete) setTimeout(onComplete, 2000); // Simulate splash delay
      });
  }, [onComplete]);

  useEffect(() => {
    if (userId) {
      logger.info('Splash page viewed', { userId });
    }
  }, [userId]);

  return (
    <div className="splash">
      <h1>Welcome to Wally!</h1>
      {daysLeft !== null && (
        <p>Your contract expires in <strong>{daysLeft}</strong> days.</p>
      )}
      <p>{loading ? "Loading..." : "Ready!"}</p>
    </div>
  );
};

export default SplashPage;