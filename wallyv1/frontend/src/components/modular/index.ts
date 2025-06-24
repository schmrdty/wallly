// Modular components for use across the application
// Some components show for all users, others only for signed-in users

export { HealthStatus } from './HealthStatus';
export { FeedbackComponent } from './FeedbackComponent';
export { SettingsComponent } from './SettingsComponent';
export { ResultDisplay } from './ResultDisplay';
export { TermsDisclaimer } from './TermsDisclaimer';
export { DashboardSummary } from './DashboardSummary';
export { RecentActivityFeed } from './RecentActivityFeed';

// Component visibility configuration
export const componentVisibility = {
    // Always visible components
    alwaysVisible: ['HealthStatus', 'FeedbackComponent', 'TermsDisclaimer'],

    // Only visible for signed-in users
    signedInOnly: ['DashboardSummary', 'ResultDisplay', 'RecentActivityFeed'],

    // Components that can optionally show for signed-in users
    conditional: ['FeedbackComponent', 'SettingsComponent', 'RecentActivityFeed']
} as const;

// All modular components are already importable from './modular/index.ts'.
// You can safely delete the disclaimer, feedback, result, and settings pages as all their logic is modularized.
