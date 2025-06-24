// WalletWatchingManager: Button to open/close WalletWatcher modal
import React, { useState } from 'react';
import WalletWatcher from './WalletWatcher';

const WalletWatchingManager: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="pondWater-btn flex items-center w-full px-4 py-3 my-1 text-left bg-white/10 border-yellow-400 text-white/80"
        style={{ borderRadius: '10px', border: '2px solid #FFD600', boxShadow: '0 0 16px 2px #FFD60055', fontFamily: 'pondWater, SF Pro Display, sans-serif', fontWeight: 600, textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)', marginBottom: '12px' }}
        onClick={() => setOpen(true)}
      >
        <span className="mr-3 text-lg">👁️</span> Wallet Watching
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)} aria-label="Close Wallet Watching Modal">✕</button>
            <WalletWatcher />
          </div>
        </div>
      )}
    </>
  );
};

export default WalletWatchingManager;