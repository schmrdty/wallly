import React from 'react';

const SAFETY_TIPS = [
  "Always double-check the recipient's address before confirming a transfer.",
  "Keep your Farcaster credentials secure and do not share them with anyone.",
  "By interacting with Wally, you acknowledge that Wally keeps the following data: Watched Address, date/time of permission granted and revoked & userId."
];

export const InstructionsSafetyTips: React.FC = () => (
  <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500">
    <h2 className="text-2xl font-semibold mb-4 text-red-800 dark:text-red-200 flex items-center">
      <span className="mr-2">⚠️</span>
      Safety Tips
    </h2>
    <ul className="space-y-3 text-red-700 dark:text-red-300">
      {SAFETY_TIPS.map((tip, idx) => (
        <li key={idx} className="flex items-start">
          <span className="text-red-500 mr-2 mt-1 flex-shrink-0">•</span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </section>
);
