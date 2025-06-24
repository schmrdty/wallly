import React from 'react';

export const InstructionsHelp: React.FC = () => (
  <section className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
    <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-200 flex items-center">
      <span className="mr-2">💬</span>
      Need Help?
    </h2>
    <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
      If you encounter any issues or have questions, please refer to the FAQ section or contact{' '}
      <a href="https://warpcast.com/schmidtiest" className="font-semibold underline hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
        @schmidtiest
      </a>{' '}
      on Farcaster.
    </p>
    <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
      <p className="text-sm text-blue-600 dark:text-blue-400">
        <strong>Pro Tip:</strong> Always test with small amounts first before setting up larger automated transfers.
      </p>
    </div>
  </section>
);
