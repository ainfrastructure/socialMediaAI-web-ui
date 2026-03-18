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
  function applyTheme(el: HTMLElement | null) {
    if (!el) return
    const t = activeTheme

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

    el.style.setProperty('--lp-bg-primary', bg)
    el.style.setProperty('--lp-bg-surface', surface)
    el.style.setProperty('--lp-bg-card', card)
    el.style.setProperty('--lp-bg-elevated', t.darkCard)
    el.style.setProperty('--lp-accent-orange', t.accent)
    el.style.setProperty('--lp-accent-orange-hover', t.accentMuted)
    el.style.setProperty('--lp-accent-orange-glow', `${t.accent}40`)
    el.style.setProperty('--lp-accent-violet', t.secondary)
    el.style.setProperty('--lp-accent-blue', t.accentLight)
    el.style.setProperty('--lp-accent-cyan', t.accentLight)
    el.style.setProperty('--lp-gradient-aurora', `linear-gradient(135deg, ${t.accent}, ${t.accentLight}, ${t.secondary})`)
    el.style.setProperty('--lp-gradient-orange', `linear-gradient(135deg, ${t.accent}, ${t.accentMuted})`)
    el.style.setProperty('--lp-text-primary', textPrimary)
    el.style.setProperty('--lp-text-secondary', textSecondary)
    el.style.setProperty('--lp-text-muted', textMuted)
    el.style.setProperty('--lp-border', border)
    el.style.setProperty('--lp-border-light', borderLight)
    el.style.setProperty('--lp-glass-bg', glassBg)
    el.style.setProperty('--lp-glass-border', glassBorder)
    el.style.setProperty('--lp-shadow-card', '0 4px 24px rgba(0,0,0,0.4)')
    el.style.setProperty('--lp-shadow-glow', `0 0 40px ${t.accent}26`)
    el.style.setProperty('--lp-nav-scrolled-bg', `rgba(${hexToRgb(bg)},0.8)`)
    el.style.setProperty('--lp-nav-mobile-bg', `rgba(${hexToRgb(bg)},0.95)`)
    el.style.setProperty('--lp-hover-overlay', 'rgba(255,255,255,0.06)')

    document.body.style.backgroundColor = bg
    el.style.colorScheme = 'dark'

    // Also set variables on documentElement so teleported components inherit them
    const root = document.documentElement
    for (const prop of Array.from(el.style)) {
      if (prop.startsWith('--lp-')) {
        root.style.setProperty(prop, el.style.getPropertyValue(prop))
      }
    }

    const glowEl = el.querySelector('.lp-cursor-glow') as HTMLElement | null
    if (glowEl) {
      glowEl.style.background = `radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), ${t.accent}10, transparent 60%)`
    }
  }

  function hexToRgb(hex: string): string {
    const h = hex.replace('#', '')
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
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
    applyTheme,
  }
}
