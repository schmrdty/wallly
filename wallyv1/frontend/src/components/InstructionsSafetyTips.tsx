import React from 'react';

const SAFETY_TIPS = [
  "Always double-check the recipient's address before confirming a transfer.",
  "Keep your Farcaster credentials secure and do not share them with anyone.",
  "By interacting with Wally, you acknowledge that Wally keeps the following data: Watched Address, date/time of permission granted and revoked & userId."
];

export const InstructionsSafetyTips: React.FC = () => (
  <>
    <h2>Safety Tips</h2>
    <ul>
      {SAFETY_TIPS.map((tip, idx) => (
        <li key={idx}>{tip}</li>
      ))}
    </ul>
  </>
);
