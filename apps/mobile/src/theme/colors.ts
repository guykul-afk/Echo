/**
 * Strict 3-Color Luxury Minimalist Palette for Echo (הד)
 * 1. Void / Canvas: #07080B
 * 2. Unified Typography: #E6E8EE (Single unified color for all text)
 * 3. Accent & Living Fill: #D4AF37 (Gold / Amber)
 */
export const LuxuryTheme = {
  // Color 1: The Void Canvas
  background: {
    base: '#07080B',
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceElevated: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(212, 175, 55, 0.15)'
  },
  // Color 2: Single Unified Typography
  text: {
    primary: '#E6E8EE',
    secondary: 'rgba(230, 232, 238, 0.70)',
    tertiary: 'rgba(230, 232, 238, 0.45)',
    inverse: '#07080B'
  },
  // Color 3: Accent & Living Dynamic Fill
  accent: {
    gold: '#D4AF37',
    goldRgb: '212, 175, 55',
    auraGlow: 'rgba(212, 175, 55, 0.25)',
    auraSecondary: 'rgba(212, 175, 55, 0.12)',
    amberWarning: '#D4AF37',
    emeraldSuccess: '#D4AF37',
    cyanInfo: '#D4AF37'
  },
  // All epistemic roles unified strictly to the single accent color
  epistemicRoles: {
    goal: '#D4AF37',
    observation: '#D4AF37',
    evaluation: '#D4AF37',
    assumption: '#D4AF37',
    unknown: '#D4AF37',
    prediction: '#D4AF37'
  }
};

