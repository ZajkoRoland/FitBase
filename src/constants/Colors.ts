/*
 * FitBase — Colors
 * Usage:
 *   import { Colors } from '@/constants/Colors';
 *   backgroundColor: Colors.background.primary
 */

export const Colors = {
  background: {
    primary: '#0D1528',
    card: '#0C0C18',
    subtle: '#1A2336',
    selected: 'rgba(74, 184, 248, 0.10)',
    elevated: '#152038',
  },

  accent: {
    blue: '#4AB8F8',
    green: '#00E676',
    teal: '#00BCD4',
    lime: '#C6FF00',
    amber: '#FFB300',
    purple: '#9C27B0',
    rose: '#E91E63',
    orange: '#FF6D00',
    sky: '#4FC3F7',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#8896A5',
    ghost: 'rgba(255,255,255,0.20)',
    dim: 'rgba(255,255,255,0.45)',
  },

  border: {
    default: 'rgba(255,255,255,0.08)',
    active: '#4AB8F8',
    divider: 'rgba(255,255,255,0.12)',
    bell: 'rgba(255,255,255,0.30)',
    navy: '#1E2D4A',
  },

  ui: {
    tabBar: '#152038',
    tabActive: '#FFFFFF',
    tabInactive: '#4A5568',
    bell: 'rgba(255, 255, 255, 0.06)',
    tagBg: 'rgba(255,255,255,0.08)',
  },

  status: {
    error: '#FF6B81',
    errorBg: 'rgba(255, 107, 129, 0.10)',
    errorBorder: 'rgba(255, 107, 129, 0.35)',
    success: '#4ADE80',
    successBg: 'rgba(74, 222, 128, 0.10)',
    successBorder: 'rgba(74, 222, 128, 0.35)',
  },
} as const;

export const BG = Colors.background.primary;
export const CARD = Colors.background.card;
export const ACCENT = Colors.accent.blue;
export const GREEN = Colors.accent.green;
export const TEXT = Colors.text.primary;
export const MUTED = Colors.text.secondary;
