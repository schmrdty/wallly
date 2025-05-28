'use client';
import React from 'react';
import RenewButton from '@/components/RenewButton';
import { useSettingsForm } from '@/hooks/useSettingsForm';
import { SettingsStatus } from '@/components/SettingsStatus';
import { tryDetectMiniAppClient } from '@/utils/miniAppDetection';
import { MiniAppBanner } from '@/components/MiniAppBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';

function isMiniAppClient() {
  try {
    return tryDetectMiniAppClient();
  } catch {
    return false;
  }
}

const Settings = () => {
  const {
    purgeMode,
    autoRenew,
    status,
    reminderOption,
    email,
    telegram,
    handlePurgeToggle,
    handleAutoRenewToggle,
    handleReminderChange,
    handleEmailChange,
    handleTelegramChange,
    user
  } = useSettingsForm();
  const router = useRouter();

  const isMiniApp = isMiniAppClient();
  
  return (
        <div className="container">
            <ThemeToggle />
            {isMiniApp && <MiniAppBanner />}
            <h1>Settings</h1>
            <label>
                <input
                    type="checkbox"
                    checked={purgeMode}
                    onChange={e => handlePurgeToggle(e.target.checked)}
                />
                Enable Purge Mode (delete audit logs immediately on revoke)
            </label>
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
                <strong>Purge Mode:</strong> When enabled, all your audit logs and session data will be deleted immediately when you revoke your session. When disabled, your audit logs are retained for 30 days after revoke before being deleted.
            </div>
            <label>
                <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={e => handleAutoRenewToggle(e.target.checked)}
                />
                Enable Auto-Renew
            </label>
            <RenewButton userId={user?.id ?? ''} disabled={purgeMode} />
            {purgeMode && (
                <div style={{ color: 'red' }}>
                    Renew is disabled when Purge Mode is enabled.
                </div>
            )}
            <SettingsStatus status={status} />
            <div>
                <label>
                    Reminder Option:
                    <select value={reminderOption} onChange={e => handleReminderChange(e.target.value)}>
                        <option value="none">None</option>
                        <option value="7days">Remind me when I have 7 days remaining</option>
                        <option value="1day">Remind me when I have 1 day remaining</option>
                        <option value="both">Both</option>
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Email (optional):{' '}
                    <input
                        type="email"
                        value={email}
                        onChange={e => handleEmailChange(e.target.value)}
                        placeholder="your@email.com"
                    />
                </label>
            </div>
            <div>
                <label>
                    Telegram Handle (optional):{' '}
                    <input
                        type="text"
                        value={telegram}
                        onChange={e => handleTelegramChange(e.target.value)}
                        placeholder="@yourhandle"
                    />
                </label>
            </div>
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: 8 }}>
                <strong>Note:</strong> Email Notifications are optional and off by default. You can use Wally without entering contact details.
            </div>
        </div>
    );
};

export default Settings;