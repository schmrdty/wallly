import React from 'react';

export const InstructionsGettingStarted: React.FC = () => (
  <section className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
    <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Getting Started</h2>
    <ol className="space-y-4 text-gray-700 dark:text-gray-300">
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Proceed carefully:</strong>
          <span className="ml-1">Please be aware that this dApp is in Beta and that you may encounter bugs or issues, please report to @schmidtiests.eth. Use at your own risk.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Farcaster Authentication:</strong>
          <span className="ml-1">Sign in with your Farcaster account first. This provides secure access and links your profile to Wally. If you're using the Farcaster Mini App, this happens automatically.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Wallet Connection:</strong>
          <span className="ml-1">Connect your Ethereum wallet (MetaMask, WalletConnect, etc.) to enable blockchain transactions. This wallet will be the one that Wally monitors and manages.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Dashboard Overview:</strong>
          <span className="ml-1">Access your personalized dashboard to view your connected address, manage sessions, and configure Wally's monitoring settings.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">5</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Set Transfer Rules:</strong>
          <span className="ml-1">Configure automatic transfer rules by specifying destination addresses, tokens to monitor, and minimum amounts to keep in your watched wallet.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">6</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Monitor & Manage:</strong>
          <span className="ml-1">Keep track of your sessions, permissions, and active monitoring rules. You can revoke access or modify settings at any time through the dashboard.</span>
        </div>
      </li>
      <li className="flex items-start">
        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">7</span>
        <div>
          <strong className="text-gray-800 dark:text-gray-200">Data & Security:</strong>
          <span className="ml-1">When your session expires, you can receive notifications via your connected communication methods. All data can be exported for your records.</span>
        </div>
      </li>
    </ol>
  </section>
);
