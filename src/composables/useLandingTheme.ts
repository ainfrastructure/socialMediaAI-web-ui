import { ref, computed, watchEffect } from 'vue'

export interface LandingTheme {
  id: string
  name: string
  family: string
  accent: string
  accentLight: string
  accentMuted: string
  // Dark mode
  darkBg: string
  darkSurface: string
  darkCard: string
  // Light mode
  lightBg: string
  lightCream: string
  // Text contrast on accent (most use white, Teal uses dark)
  accentText: string
  // Secondary accent for gradients
  secondary: string
}

export const themes: LandingTheme[] = [
  // ─── Current ───
  {
    id: 'orange',
    name: 'Orange',
    family: 'Default',
    accent: '#F97316',
    accentLight: '#FB923C',
    accentMuted: '#EA580C',
    darkBg: '#09090B',
    darkSurface: '#18181B',
    darkCard: '#1C1C1F',
    lightBg: '#FAF9F6',
    lightCream: '#F3F1EB',
    accentText: '#FFFFFF',
    secondary: '#8B5CF6',
  },
  // ─── Gold Family ───
  {
    id: 'gold',
    name: 'Gold',
    family: 'Gold',
    accent: '#D4A053',
    accentLight: '#E8C882',
    accentMuted: '#B8883B',
    darkBg: '#141211',
    darkSurface: '#1C1A17',
    darkCard: '#252320',
    lightBg: '#FAF9F6',
    lightCream: '#F3F1EB',
    accentText: '#FFFFFF',
    secondary: '#B8883B',
  },
  {
    id: 'rose',
    name: 'Rose',
    family: 'Gold',
    accent: '#CD7F5B',
    accentLight: '#E0A88A',
    accentMuted: '#B06840',
    darkBg: '#141211',
    darkSurface: '#1C1A17',
    darkCard: '#252320',
    lightBg: '#FAF9F6',
    lightCream: '#F3F1EB',
    accentText: '#FFFFFF',
    secondary: '#B06840',
  },
  {
    id: 'honey',
    name: 'Honey',
    family: 'Gold',
    accent: '#CA8A04',
    accentLight: '#EAB308',
    accentMuted: '#A16207',
    darkBg: '#141211',
    darkSurface: '#1C1A17',
    darkCard: '#252320',
    lightBg: '#FAF9F6',
    lightCream: '#F3F1EB',
    accentText: '#FFFFFF',
    secondary: '#A16207',
  },
  // ─── YachtZoo Family ───
  {
    id: 'bronze',
    name: 'Bronze',
    family: 'YachtZoo',
    accent: '#AB885A',
    accentLight: '#C8A87E',
    accentMuted: '#8E6E42',
    darkBg: '#0A1820',
    darkSurface: '#112835',
    darkCard: '#1A3545',
    lightBg: '#F8FAFC',
    lightCream: '#EDF3F7',
    accentText: '#FFFFFF',
    secondary: '#8E6E42',
  },
  {
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
  },
  {
    id: 'teal',
    name: 'Teal',
    family: 'YachtZoo',
    accent: '#79C6E0',
    accentLight: '#A8DBEB',
    accentMuted: '#4FABC8',
    darkBg: '#0A1820',
    darkSurface: '#112835',
    darkCard: '#1A3545',
    lightBg: '#F8FAFC',
    lightCream: '#EDF3F7',
    accentText: '#1A1A1A',
    secondary: '#4FABC8',
  },
  // ─── 2 Extra ───
  {
    id: 'ember',
    name: 'Ember',
    family: 'Extra',
    accent: '#E85D3A',
    accentLight: '#F08C6E',
    accentMuted: '#C44A2A',
    darkBg: '#120E0C',
    darkSurface: '#1E1714',
    darkCard: '#29201C',
    lightBg: '#FBF8F6',
    lightCream: '#F5EFEA',
    accentText: '#FFFFFF',
    secondary: '#C44A2A',
  },
  {
    id: 'violet',
    name: 'Violet',
    family: 'Extra',
    accent: '#8B5CF6',
    accentLight: '#A78BFA',
    accentMuted: '#7C3AED',
    darkBg: '#0C0A14',
    darkSurface: '#16132A',
    darkCard: '#1E1A38',
    lightBg: '#FAF9FE',
    lightCream: '#F3F1FA',
    accentText: '#FFFFFF',
    secondary: '#7C3AED',
  },
]

export type BgMode = 'none' | 'wave' | 'particles'

export interface FontTheme {
  id: string
  name: string
  heading: string
  body: string
}

export const fontThemes: FontTheme[] = [
  { id: 'native', name: 'Native', heading: 'Playfair Display', body: 'DM Sans' },
  { id: 'elegant', name: 'Elegant', heading: 'Crimson Pro', body: 'Work Sans' },
  { id: 'current', name: 'Current', heading: 'Playfair Display', body: 'Inter' },
  { id: 'apple', name: 'Apple', heading: 'System UI', body: 'System UI' },
  { id: 'classic', name: 'Classic', heading: 'EB Garamond', body: 'Lora' },
  { id: 'modern', name: 'Modern', heading: 'Outfit', body: 'Montserrat' },
  { id: 'luxury', name: 'Luxury', heading: 'Cormorant Garamond', body: 'Raleway' },
  { id: 'boutique', name: 'Boutique', heading: 'Libre Baskerville', body: 'Nunito Sans' },
  { id: 'startup', name: 'Startup', heading: 'Space Grotesk', body: 'DM Sans' },
  { id: 'editorial', name: 'Editorial', heading: 'Fraunces', body: 'Source Sans 3' },
  { id: 'humanist', name: 'Humanist', heading: 'Sora', body: 'Rubik' },
  { id: 'swiss', name: 'Swiss', heading: 'Instrument Sans', body: 'Inter' },
]

const fontThemeId = ref('native')
const activeThemeId = ref('ocean')
const isDarkMode = ref(true)
const bgMode = ref<BgMode>('particles')
const bgIntensity = ref(3)
const bgParticleCount = ref(4)
const bgParticleColorMode = ref<'default' | 'adapt' | 'vortex'>('vortex')
const bgParticleStyle = ref<'flow' | 'swarm'>('flow')

const activeTheme = computed(() =>
  themes.find((t) => t.id === activeThemeId.value) ?? themes[0]
)

export function useLandingTheme() {
  function setTheme(id: string) {
    activeThemeId.value = id
  }

  function toggleMode() {
    isDarkMode.value = !isDarkMode.value
  }

  function setBgMode(mode: BgMode) {
    bgMode.value = mode
  }

  function setBgParticleCount(value: number) {
    bgParticleCount.value = Math.max(0.5, Math.min(5, value))
  }

  function setBgParticleColorMode(mode: 'default' | 'adapt' | 'vortex') {
    bgParticleColorMode.value = mode
  }

  function setBgParticleStyle(style: 'flow' | 'swarm') {
    bgParticleStyle.value = style
  }

  function setFontTheme(id: string) {
    fontThemeId.value = id
    document.documentElement.setAttribute('data-font-theme', id)
  }

  // Apply default font theme on first use
  if (!document.documentElement.hasAttribute('data-font-theme')) {
    document.documentElement.setAttribute('data-font-theme', fontThemeId.value)
  }

  function setBgIntensity(value: number) {
    bgIntensity.value = Math.max(0.1, Math.min(5, value))
  }

  function applyTheme(el: HTMLElement | null) {
    if (!el) return
    const t = activeTheme.value
    const dark = isDarkMode.value

    const bg = dark ? t.darkBg : t.lightBg
    const surface = dark ? t.darkSurface : t.lightCream
    const card = dark ? t.darkCard : '#FFFFFF'
    const textPrimary = dark ? '#F4F4F5' : '#1F1F1F'
    const textSecondary = dark ? '#A1A1AA' : '#5A5A5A'
    const textMuted = dark ? '#71717A' : '#888888'
    const border = dark ? 'rgba(255,255,255,0.06)' : `rgba(0,0,0,0.08)`
    const borderLight = dark ? 'rgba(255,255,255,0.1)' : `rgba(0,0,0,0.12)`
    const glassBg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)'
    const glassBorder = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'

    el.style.setProperty('--lp-bg-primary', bg)
    el.style.setProperty('--lp-bg-surface', surface)
    el.style.setProperty('--lp-bg-card', card)
    el.style.setProperty('--lp-bg-elevated', dark ? t.darkCard : t.lightCream)
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
    el.style.setProperty('--lp-shadow-card', dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)')
    el.style.setProperty('--lp-shadow-glow', `0 0 40px ${t.accent}26`)
    // Derived variables for nav / hover effects
    el.style.setProperty('--lp-nav-scrolled-bg', dark ? `rgba(${hexToRgb(bg)},0.8)` : `rgba(${hexToRgb(bg)},0.85)`)
    el.style.setProperty('--lp-nav-mobile-bg', dark ? `rgba(${hexToRgb(bg)},0.95)` : `rgba(${hexToRgb(bg)},0.97)`)
    el.style.setProperty('--lp-hover-overlay', dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')

    // Update body background
    document.body.style.backgroundColor = bg

    // Update color-scheme
    el.style.colorScheme = dark ? 'dark' : 'light'

    // Also set variables on documentElement so teleported components (e.g. ThemeSwitcher) inherit them
    const root = document.documentElement
    for (const prop of Array.from(el.style)) {
      if (prop.startsWith('--lp-')) {
        root.style.setProperty(prop, el.style.getPropertyValue(prop))
      }
    }

    // Update cursor glow color
    const glowEl = el.querySelector('.lp-cursor-glow') as HTMLElement | null
    if (glowEl) {
      glowEl.style.background = `radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), ${t.accent}10, transparent 60%)`
    }
  }

  function hexToRgb(hex: string): string {
    const h = hex.replace('#', '')
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`
  }

  // Auto-apply whenever theme or mode changes
  watchEffect(() => {
    // Access reactive deps to trigger re-application
    void activeTheme.value
    void isDarkMode.value
  })

  return {
    activeTheme,
    activeThemeId,
    isDarkMode,
    bgMode,
    bgIntensity,
    bgParticleCount,
    bgParticleColorMode,
    bgParticleStyle,
    fontThemeId,
    fontThemes,
    themes,
    setTheme,
    toggleMode,
    setBgMode,
    setBgIntensity,
    setBgParticleCount,
    setBgParticleColorMode,
    setBgParticleStyle,
    setFontTheme,
    applyTheme,
  }
}
