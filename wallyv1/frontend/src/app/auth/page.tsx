'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { SignInButton, useProfile } from '@farcaster/auth-kit';
import { useFarcasterAuth } from '../../hooks/useFarcasterAuth.ts';
import { useSessionContext } from '../../context/SessionContext.tsx';
import WalletConnectionManager from '../../components/WalletConnectionManager.tsx';
import { HealthStatus, TermsDisclaimer } from '../../components/modular';
import { sdk } from '@farcaster/frame-sdk';
import CoinbaseWalletConnector from '../../components/CoinbaseWalletConnector.tsx';
import ReownAppKitWalletConnector from '../../components/ReownAppKitWalletConnector.tsx';
import WalletWatchingManager from '../../components/WalletWatchingManager.tsx';

const SECTIONS = [
  { id: 'about', label: 'About', icon: <img src="/icon-32.png" alt="About" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> },
  { id: 'terms', label: 'Terms of Use', icon: <img src="/icon-32.png" alt="Terms" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> },
  { id: 'health', label: 'Health', icon: <img src="/icon-32.png" alt="Health" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> },
  { id: 'share', label: 'Share Wally', icon: <img src="/icon-32.png" alt="Share" width={24} height={24} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> },
];

const PRIMARY_SECTION = 'auth';

export default function AuthPage() {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState(PRIMARY_SECTION);
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Defensive initialization for wagmi hooks
  const account = useAccount?.() || {};
  const { address = '', isConnected = false } = account;

  const connectHook = useConnect?.() || {};
  const { connect = () => { }, connectors = [] } = connectHook;

  const disconnectHook = useDisconnect?.() || {};
  const { disconnect = () => { } } = disconnectHook;

  // Defensive initialization for Farcaster profile
  const profileHook = useProfile?.() || { isAuthenticated: false, profile: null };
  const { isAuthenticated, profile } = profileHook;

  // Defensive initialization for Farcaster Auth
  const farcasterAuth = useFarcasterAuth?.() || { signIn: async () => { }, isLoading: false };
  const { signIn: farcasterSignIn, isLoading: fcLoading } = farcasterAuth;

  // Defensive initialization for Session Context
  const sessionContext = useSessionContext?.() || { isValid: false, loading: false, user: null };
  const { isValid: hasValidSession, loading: sessionLoading, user } = sessionContext;

  // Warn if any hook is not initialized
  useEffect(() => {
    if (!useFarcasterAuth) console.warn('useFarcasterAuth is not initialized');
    if (!useSessionContext) console.warn('useSessionContext is not initialized');
    if (!useAccount) console.warn('useAccount is not initialized');
    if (!useConnect) console.warn('useConnect is not initialized');
    if (!useDisconnect) console.warn('useDisconnect is not initialized');
    if (!useProfile) console.warn('useProfile is not initialized');
  }, []);

  useEffect(() => {
    setIsClient(true);
    // Detect if running in Farcaster Mini App
    const detectMiniApp = async () => {
      try {
        if (typeof sdk !== 'undefined' && sdk.context) {
          const context = await sdk.context;
          setIsMiniApp(!!context?.client?.clientFid);
          console.log('🔍 Mini App context:', context);
        }
      } catch (error) {
        console.warn('Not running in Farcaster Mini App:', error);
      }
    };
    detectMiniApp();
  }, []);

  // Debug logging for session state
  useEffect(() => {
    console.log('🔍 Auth Page Session Debug:', {
      hasValidSession,
      sessionLoading,
      isAuthenticated,
      profileExists: !!profile,
      fcLoading
    });
  }, [hasValidSession, sessionLoading, isAuthenticated, profile, fcLoading]);

  // Redirect to dashboard if user has valid backend session OR if they're authenticated with Farcaster and not loading
  useEffect(() => {
    if (!sessionLoading && hasValidSession) {
      console.log('✅ Valid backend session found, redirecting to dashboard');
      router.push('/dashboard');
    } else if (isAuthenticated && !fcLoading && !sessionLoading) {
      // If Farcaster is authenticated but no session yet, give it a moment then redirect anyway
      const timeout = setTimeout(() => {
        console.log('⚠️ Farcaster authenticated but no backend session, redirecting anyway');
        router.push('/dashboard');
      }, 1000); // Wait 1 second for session creation
      return () => clearTimeout(timeout);
    }
  }, [hasValidSession, sessionLoading, isAuthenticated, fcLoading, router]);

  // Section content rendering
  const renderSection = () => {
    if (selectedSection === PRIMARY_SECTION) {
      return (
        <div className="space-y-6 flex flex-col items-center w-full">
          <h2 className="text-2xl font-semibold text-white mb-4 pondWater-font text-center">Authentication</h2>
          <div style={{ border: '2px solid #FFD600', borderRadius: 8, boxShadow: '0 0 8px #FFD600', fontFamily: 'pondWater, SF Pro Display, sans-serif', display: 'inline-block' }}>
            <SignInButton />
          </div>
          {/* Wallet sign-in buttons removed: only Farcaster AuthKit is shown */}
        </div>
      );
    }
    // For all other sections, show a back button and the section content
    return (
      <div className="space-y-6 w-full">
        <button
          className="pondWater-btn flex items-center px-4 py-2 mb-4 bg-white/20 border border-white/40 text-white font-bold rounded-lg shadow hover:bg-white/30 transition-all"
          onClick={() => setSelectedSection(PRIMARY_SECTION)}
        >
          <span className="mr-2">←</span> Back
        </button>
        {(() => {
          switch (selectedSection) {
            case 'about':
              return <AboutWallyWalkthrough />;
            case 'terms':
              router.push('/terms');
              return null;
            case 'health':
              router.push('/health');
              return null;
            case 'share':
              return <ShareWally />;
            default:
              return null;
          }
        })()}
      </div>
    );
  }; return (
    <div className="relative flex flex-row min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black text-white pondWater-font">
      {/* Global Sign Out Buttons */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 12 }}>
      </div>
      {/* Sidebar */}
      <aside className="flex flex-col w-64 min-h-screen p-4 bg-white/10 backdrop-blur-md pondWater-font" style={{ backdropFilter: 'blur(15px)' }}>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`pondWater-btn flex flex-row items-center w-full px-4 py-3 my-1 text-left ${selectedSection === section.id ? 'bg-white/20 text-white font-bold' : 'bg-white/10 text-white/80'}`}
            style={{
              borderRadius: '10px',
              border: '2px solid #FFD600',
              boxShadow: '0 0 16px 2px #FFD60055',
              fontFamily: 'pondWater, SF Pro Display, sans-serif',
              fontWeight: 600,
              textShadow: '0px 4px 10px #FFD600, 0px 4px 10px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => setSelectedSection(section.id)}
            aria-label={section.label}
          >
            <span className="mr-3 text-lg">{section.icon}</span> {section.label}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className="w-full max-w-2xl bg-white/10 rounded-xl shadow-lg p-8 pondWater-font border-2 border-yellow-400 flex flex-col gap-6 items-center"
          style={{ backdropFilter: 'blur(15px)' }}
        >
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

// AboutWallyWalkthrough: walkthrough with ELI5 toggle
function AboutWallyWalkthrough() {
  const [eli5, setEli5] = useState(false);
  return (
    <div className="bg-white/10 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">What is Wally?</h2>
        <button
          className="pondWater-btn px-3 py-1 text-sm"
          onClick={() => setEli5((v) => !v)}
          aria-pressed={eli5}
        >
          {eli5 ? 'Show Walkthrough' : 'ELI5'}
        </button>
      </div>
      {eli5 ? (
        <div className="text-lg text-yellow-100">
          <p>Wally is like a super-smart duck that watches your wallet for you. It helps you keep your crypto safe, automates boring stuff, and never touches your money. You’re always in control!</p>
        </div>
      ) : (
        <ol className="list-decimal ml-6 text-white space-y-2">
          <li>Wally the Wallet Watcher is here to help you manage your tokens</li>
          <li>Define the rules of your automation</li>
          <li>Wally monitors & automates transfers, & if <strong>you allow</strong>, notifies you of events.</li>
          <li>You can revoke permissions or change settings at any time.</li>
          <li>Wally never has access to your private keys or funds.</li>
        </ol>
      )}
    </div>
  );
}

// ShareWally: deep link to create a cast on Farcaster
function ShareWally() {
  const shareUrl =
    'https://farcaster.xyz/~/compose?text=' +
    encodeURIComponent('Check out Wally the Wallet Watcher! https://wally.schmidtiest.xyz/');
  return (
    <div className="flex flex-col items-center gap-4 pondWater-font bg-white/10 backdrop-blur-md rounded-xl p-6 w-full max-w-md mx-auto">
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="pondWater-btn px-6 py-3 text-lg font-semibold"
        aria-label="Share Wally on Farcaster"
      >
        Share Wally on Farcaster
      </a>
      <p className="text-white/80">Let your friends know about Wally!</p>
    </div>
  );
}
