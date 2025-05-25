import React from 'react';
import { InstructionsGettingStarted } from '../src/components/InstructionsGettingStarted';
import { InstructionsSafetyTips } from '../src/components/InstructionsSafetyTips';
import { InstructionsHelp } from '../src/components/InstructionsHelp';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';
import styles from '../styles/Instructions.module.css';

const Instructions = () => {
  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className={styles.instructionsContainer}>
      {isMiniApp && <MiniAppBanner />}
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <p>This application allows you to automate non-custodial token transfers securely and efficiently.</p>
      <InstructionsGettingStarted />
      <InstructionsSafetyTips />
      <InstructionsHelp />
    </div>
  );
};

export default Instructions;