export const COLORS = {
  primary: '#032548',
  white: '#FFFFFF',
  border: '#ECECEC',
  pending: '#F59E0B',
  uploaded: '#1A9E5A',
  failed: '#E30235',
  greyText: '#6B7280',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export type ColorKey = keyof typeof COLORS;
