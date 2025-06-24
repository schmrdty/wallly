'use client';
import React from 'react';
import BackButton from '@/components/BackButton';
import { InstructionsGettingStarted } from '@/components/InstructionsGettingStarted';
import { InstructionsSafetyTips } from '@/components/InstructionsSafetyTips';
import { InstructionsHelp } from '@/components/InstructionsHelp';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';

const Instructions = () => {
  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Instructions</h1>
            <div></div> {/* Spacer for flex layout */}
          </div>

          {isMiniApp && (
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-6 text-center">
              <p className="text-blue-800 dark:text-blue-200">Farcaster Mini-Wally</p>
            </div>
          )}

          <div className="space-y-8">
            <InstructionsGettingStarted />
            <InstructionsSafetyTips />
            <InstructionsHelp />
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-2 text-yellow-500">What is Wally?</h2>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              <b>Wally the Wallet Watcher (BETA)</b> is a Farcaster-first, non-custodial wallet monitoring and automation tool (coming soon). It helps you keep track of your crypto wallets, get notified of activity, and automate safe transfers—without ever giving up control of your keys.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">How does it work?</h2>
            <ol className="list-decimal ml-6 text-gray-700 dark:text-gray-200">
              <li>Connect your wallet (Coinbase, reOwn AppKit, or others) securely—Wally never stores your private keys.</li>
              <li>Authenticate with Farcaster for social login and extra security.</li>
              <li>Wally watches your wallet for activity and can automate transfers you approve.</li>
              <li>All sessions and permissions are tracked securely (with Redis) and never expose sensitive data.</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">What Wally does <b>NOT</b> do</h2>
            <ul className="list-disc ml-6 text-gray-700 dark:text-gray-200">
              <li>Wally does <b>not</b> take custody of your funds or private keys.</li>
              <li>Wally does <b>not</b> share your data with third parties.</li>
              <li>Wally does <b>not</b> automate any transfer without your explicit approval.</li>
              <li>Wally does <b>not</b> store sensitive info in the browser or on the server.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">ELI5: Explain Like I'm 5</h2>
            <p className="text-gray-700 dark:text-gray-200">
              Wally is like a robot helper that watches your piggy bank (crypto wallet) and tells you if anything happens. It can help you move your coins, but only if you say it's okay. You always keep the key to your piggy bank!
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-2 text-yellow-400">Need Help?</h2>
            <p className="text-gray-700 dark:text-gray-200">
              If you have questions or need support, check the FAQ or contact the schmidtiest.eth on Farcaster.
            </p>
          </section>

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

export default Instructions;