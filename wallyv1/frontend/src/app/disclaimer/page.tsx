"use client";

import React from 'react';
import BackButton from '@/components/BackButton';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';

const Disclaimer = () => {
  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Disclaimer</h1>
            <div></div> {/* Spacer for flex layout */}
          </div>

          {isMiniApp && (
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-6 text-center">
              <p className="text-blue-800 dark:text-blue-200">Farcaster Mini-Wally</p>
            </div>
          )}

          <div className="prose max-w-none">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500 mb-6">
              <p className="text-red-800 dark:text-red-200 font-semibold text-lg">
                Wally the Wallet Watcher is provided "as is" without any warranties of any kind.
              </p>
            </div>

            <div className="space-y-6">
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1 flex-shrink-0">⚠️</span>
                  <span>Use of this application is at your own risk.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3 mt-1 flex-shrink-0">🔒</span>
                  <span>Wally does not store your private keys or sensitive wallet information.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1 flex-shrink-0">💰</span>
                  <span>We are not responsible for any loss of funds, data, or damages resulting from the use of this app.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1 flex-shrink-0">✅</span>
                  <span>Always verify all transactions and actions in your wallet before confirming.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-3 mt-1 flex-shrink-0">📊</span>
                  <span>This app is not financial advice and should not be used as such.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-3 mt-1 flex-shrink-0">🚧</span>
                  <span>Wally is in beta and features may change or be discontinued at any time.</span>
                </li>
              </ul>

              <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  For questions or concerns, contact{' '}
                  <a
                    href="mailto:schmrdty@proton.me"
                    className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    schmrdty@proton.me
                  </a>
                </p>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p>&copy; 2025 Wally the Wallet Watcher</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => window.location.href = '/auth'}
              className="pondWater-btn px-6 py-3 rounded-lg font-semibold"
            >
              Back to Auth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
