'use client';
import React, { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

const Terms = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);

  // Detect Mini App environment using SDK
  useEffect(() => {
    const detectMiniApp = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);
      } catch (error) {
        console.warn('Not in Farcaster Mini App:', error);
        setIsMiniApp(false);
      }
    };

    detectMiniApp();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black pondWater-font">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-lg max-w-2xl w-full mx-auto pondWater-font">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => window.location.href = '/auth'}
            className="pondWater-btn px-6 py-3 rounded-lg font-semibold"
          >
            Back to Auth
          </button>
          <h1 className="text-3xl font-bold text-white text-center flex-1">Wally the Wallet Watcher</h1>
          <div style={{ width: 120 }}></div> {/* Spacer for flex layout */}
        </div>
        {isMiniApp && (
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-6 text-center">
            <p className="text-green-800 dark:text-green-200">A Product of Myceliyou</p>
          </div>
        )}
        <div className="prose max-w-none text-white">
          <p className="text-purple-200 mb-6 italic">
            <strong className="text-white">Terms & Conditions</strong><br />
            <em>(Last Updated: January 2025)</em>
          </p>

          <div className="space-y-8 text-white">
            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">1. Introduction</h3>
              <p className="leading-relaxed">
                Wally the Wallet Watcher ("Wally") is a <strong>non-custodial wallet automation tool</strong>.
                By using Wally, you agree to the following terms, which may be updated periodically.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">2. User Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Wally does not store private keys or funds—users remain <strong>solely responsible</strong> for their wallets.</li>
                <li>Users must <strong>verify all transactions</strong> before execution.</li>
                <li>Wally <strong>does not provide financial or investment advice</strong>. Use it at your own risk.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">3. Consent & Usage</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>By <strong>signing in with your wallet</strong>, you consent to the automation and monitoring features described in the app.</li>
                <li>Wally may analyze and facilitate transaction forwarding based on user-defined criteria.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">4. Service Modifications & Future Monetization</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Wally may introduce <strong>new features, fees, or premium services</strong> over time.</li>
                <li>By continuing to use Wally, users acknowledge that monetized features <strong>may be introduced dynamically</strong>.</li>
                <li>Any fees or pricing structures will be transparently communicated before usage.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">5. Limitation of Liability</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Wally is provided <strong>"as is"</strong>, with no warranties or guarantees.</li>
                <li>Wally is <strong>not liable for losses, technical failures, or blockchain-related issues</strong> resulting from its use.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-purple-200 mb-3">6. Compliance & Dispute Resolution</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Wally will comply with applicable laws, but users remain responsible for adhering to their jurisdiction's legal frameworks.</li>
                <li>Any disputes shall be resolved through arbitration or the applicable governing law.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
