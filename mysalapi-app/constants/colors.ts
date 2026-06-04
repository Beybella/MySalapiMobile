// Lush Island Oasis Color Strategy
export const LightColors = {
  // Backgrounds
  background: '#F3FDFB',
  surface: '#FFFFFF',

  // Accents
  primary: '#32A08E',
  primaryDark: '#2a8878',
  secondary: '#50E3C2',

  // Text
  textPrimary: '#1A2B28',
  textSecondary: '#4a6b65',
  textLight: '#8aada8',

  // Borders & misc
  border: '#d0ece8',
  highlight: '#D9BF77',

  // Status
  error: '#DC3545',
  warning: '#D9BF77',
  success: '#32A08E',
  info: '#50E3C2',

  // Health status
  healthy: '#32A08E',
  atRisk: '#D9BF77',
  critical: '#DC3545',

  // Ledger accent colors (kept distinct per ledger)
  personalLedger: '#32A08E',
  pautangLedger: '#5B8DB8',
  ambaganLedger: '#8B72BE',
  budgetPlanner: '#C9A84C',

  // Overlay
  overlay: 'rgba(26,43,40,0.5)',
};

export const DarkColors = {
  // Backgrounds
  background: '#121C1A',
  surface: '#1E2F2C',

  // Accents — soft muted teal
  primary: '#2E9E8A',
  primaryDark: '#27806F',
  secondary: '#27806F',

  // Text
  textPrimary: '#F3FDFB',
  textSecondary: '#9ecec8',
  textLight: '#5a8a84',

  // Borders & misc
  border: '#2a4440',
  highlight: '#D9BF77',

  // Status
  error: '#ff6b7a',
  warning: '#D9BF77',
  success: '#2E9E8A',
  info: '#2E9E8A',

  // Health status
  healthy: '#2E9E8A',
  atRisk: '#D9BF77',
  critical: '#ff6b7a',

  // Ledger accent colors
  personalLedger: '#2E9E8A',
  pautangLedger: '#7aafd4',
  ambaganLedger: '#a98ee0',
  budgetPlanner: '#D9BF77',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
};

// Default export kept for backward compat — will be overridden by theme context
export const Colors = LightColors;
