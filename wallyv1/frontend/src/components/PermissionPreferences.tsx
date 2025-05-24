import React from 'react';

const reminderOptions = [
  { value: 'both', label: 'Yes, 1 Week & 1 Day' },
  { value: '1day', label: 'Yes, 1 Day Only' },
  { value: '1week', label: 'Yes, 1 Week Only' },
  { value: 'none', label: 'No Reminders' }
];

interface PermissionPreferencesProps {
  autorenew: boolean;
  setAutorenew: (v: boolean) => void;
  reminder: string;
  setReminder: (v: string) => void;
  loading: boolean;
  onSave: () => void;
}

export const PermissionPreferences: React.FC<PermissionPreferencesProps> = ({
  autorenew,
  setAutorenew,
  reminder,
  setReminder,
  loading,
  onSave
}) => (
  <div>
    <label>
      Enable Auto-renew:
      <input
        type="checkbox"
        checked={autorenew}
        onChange={e => setAutorenew(e.target.checked)}
      />
    </label>
    <label>
      Reminder Preference:
      <select value={reminder} onChange={e => setReminder(e.target.value)}>
        {reminderOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
    <button type="button" onClick={onSave} disabled={loading}>
      Save Preferences
    </button>
  </div>
);
