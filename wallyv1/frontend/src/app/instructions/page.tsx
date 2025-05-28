'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { InstructionsGettingStarted } from '@/components/InstructionsGettingStarted';
import { InstructionsSafetyTips } from '@/components/InstructionsSafetyTips';
import { InstructionsHelp } from '@/components/InstructionsHelp';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '@/components/MiniAppBanner';

const Instructions = () => {
  const router = useRouter();
  const isMiniApp = tryDetectMiniAppClient();

  return (
    <div className="instructionsContainer">
      {isMiniApp && <MiniAppBanner />}
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