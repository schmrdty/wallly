import React from 'react';
import { InstructionsGettingStarted } from '../src/components/InstructionsGettingStarted';
import { InstructionsSafetyTips } from '../src/components/InstructionsSafetyTips';
import { InstructionsHelp } from '../src/components/InstructionsHelp';
import { tryDetectMiniAppClient } from '../src/utils/miniAppDetection';
import { MiniAppBanner } from '../src/components/MiniAppBanner';
import { SplashLogo } from '../src/components/SplashLogo';
import styles from '../styles/Instructions.module.css';

const Instructions = () => {
  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className={styles.instructionsContainer}>
      {isMiniApp && <MiniAppBanner />}
      <SplashLogo />
      <h1>Welcome to Wally the Wallet Watcher</h1>
      <p>
        Wally helps you automate non-custodial token transfers securely and efficiently.<br />
        Get started below, and always review safety tips!
      </p>
      <InstructionsGettingStarted />
      <InstructionsSafetyTips />
      <InstructionsHelp />
    </div>
  );
};

export default Instructions;