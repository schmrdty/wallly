import React from 'react';
import { InstructionsGettingStarted } from '../src/components/InstructionsGettingStarted';
import { InstructionsSafetyTips } from '../src/components/InstructionsSafetyTips';
import { InstructionsHelp } from '../src/components/InstructionsHelp';

const Instructions = () => (
  <div className="instructions-container">
    <h1>Welcome to Wally the Wallet Watcher</h1>
    <p>This application allows you to automate non-custodial token transfers securely and efficiently.</p>
    <InstructionsGettingStarted />
    <InstructionsSafetyTips />
    <InstructionsHelp />
  </div>
);

export default Instructions;