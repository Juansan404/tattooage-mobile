export const darkColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#2C2C2C',
  primary: '#C0392B',
  primaryDark: '#96281B',
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  border: '#2C2C2C',
  white: '#F5F5F5',
  error: '#E74C3C',
  success: '#27AE60',
  warning: '#F39C12',
  transparent: 'transparent',
} as const;

export const lightColors = {
  background: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceLight: '#EFEFEF',
  primary: '#C0392B',
  primaryDark: '#96281B',
  text: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#999999',
  border: '#E0E0E0',
  white: '#FFFFFF',
  error: '#E74C3C',
  success: '#27AE60',
  warning: '#F39C12',
  transparent: 'transparent',
} as const;

export type AppColors = typeof darkColors;

// Backward-compat static export (used by StyleSheet.create at module level)
export const Colors = darkColors;
