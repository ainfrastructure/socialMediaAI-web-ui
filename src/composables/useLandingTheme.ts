export interface LandingTheme {
  id: string
  name: string
  family: string
  accent: string
  accentLight: string
  accentMuted: string
  darkBg: string
  darkSurface: string
  darkCard: string
  lightBg: string
  lightCream: string
  accentText: string
  secondary: string
}

const activeTheme: LandingTheme = {
  id: 'ocean',
  name: 'Ocean',
  family: 'YachtZoo',
  accent: '#3A9BC0',
  accentLight: '#6EC0DE',
  accentMuted: '#2D7F9E',
  darkBg: '#081418',
  darkSurface: '#0E2230',
  darkCard: '#163040',
  lightBg: '#F8FAFC',
  lightCream: '#EDF3F7',
  accentText: '#FFFFFF',
  secondary: '#2D7F9E',
}

const isDarkMode = true
const bgMode = 'particles' as const
const bgIntensity = 3
const bgParticleCount = 4
const bgParticleColorMode = 'vortex' as const
const bgParticleStyle = 'flow' as const
const bgParticleSpeed = 1

export function useLandingTheme() {
  function hexToRgb(hex: string): string {
    const h = hex.replace('#', '')
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
  }

  /** Sets --lp-* CSS vars on documentElement + body background. No element ref needed. */
  function applyThemeGlobals() {
    const t = activeTheme
    const root = document.documentElement

    const bg = t.darkBg
    const surface = t.darkSurface
    const card = t.darkCard
    const textPrimary = '#F4F4F5'
    const textSecondary = '#A1A1AA'
    const textMuted = '#71717A'
    const border = 'rgba(255,255,255,0.06)'
    const borderLight = 'rgba(255,255,255,0.1)'
    const glassBg = 'rgba(255,255,255,0.03)'
    const glassBorder = 'rgba(255,255,255,0.06)'

    const vars: Record<string, string> = {
      '--lp-bg-primary': bg,
      '--lp-bg-surface': surface,
      '--lp-bg-card': card,
      '--lp-bg-elevated': card,
      '--lp-accent-orange': t.accent,
      '--lp-accent-orange-hover': t.accentMuted,
      '--lp-accent-orange-glow': `${t.accent}40`,
      '--lp-accent-violet': t.secondary,
      '--lp-accent-blue': t.accentLight,
      '--lp-accent-cyan': t.accentLight,
      '--lp-gradient-aurora': `linear-gradient(135deg, ${t.accent}, ${t.accentLight}, ${t.secondary})`,
      '--lp-gradient-orange': `linear-gradient(135deg, ${t.accent}, ${t.accentMuted})`,
      '--lp-text-primary': textPrimary,
      '--lp-text-secondary': textSecondary,
      '--lp-text-muted': textMuted,
      '--lp-border': border,
      '--lp-border-light': borderLight,
      '--lp-glass-bg': glassBg,
      '--lp-glass-border': glassBorder,
      '--lp-shadow-card': '0 4px 24px rgba(0,0,0,0.4)',
      '--lp-shadow-glow': `0 0 40px ${t.accent}26`,
      '--lp-nav-scrolled-bg': `rgba(${hexToRgb(bg)},0.8)`,
      '--lp-nav-mobile-bg': `rgba(${hexToRgb(bg)},0.95)`,
      '--lp-hover-overlay': 'rgba(255,255,255,0.06)',
    }

    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value)
    }

    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
  }

  /** Sets cursor glow and colorScheme on the wrapper element. Call in onMounted. */
  function applyThemeElement(el: HTMLElement | null) {
    if (!el) return
    const t = activeTheme

    el.style.colorScheme = 'dark'

    const glowEl = el.querySelector('.lp-cursor-glow') as HTMLElement | null
    if (glowEl) {
      glowEl.style.background = `radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), ${t.accent}10, transparent 60%)`
    }
  }

  return {
    activeTheme,
    isDarkMode,
    bgMode,
    bgIntensity,
    bgParticleCount,
    bgParticleColorMode,
    bgParticleStyle,
    bgParticleSpeed,
    applyThemeGlobals,
    applyThemeElement,
  }
}
