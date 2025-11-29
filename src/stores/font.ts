import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type FontTheme = 'current' | 'apple' | 'classic' | 'modern' | 'luxury' | 'elegant' | 'boutique'

export const useFontStore = defineStore('font', () => {
  // Get saved font theme from localStorage or default to 'elegant'
  const savedTheme = localStorage.getItem('fontTheme') as FontTheme | null
  const currentTheme = ref<FontTheme>(savedTheme || 'elegant')

  /**
   * Set the current font theme and persist to localStorage
   */
  function setTheme(theme: FontTheme) {
    currentTheme.value = theme
    localStorage.setItem('fontTheme', theme)

    // Apply theme to document root
    document.documentElement.setAttribute('data-font-theme', theme)
  }

  /**
   * Get the display name for a font theme
   */
  function getThemeName(theme: FontTheme): string {
    const names: Record<FontTheme, string> = {
      current: 'Current',
      apple: 'Apple',
      classic: 'Classic',
      modern: 'Modern',
      luxury: 'Luxury',
      elegant: 'Elegant',
      boutique: 'Boutique',
    }
    return names[theme]
  }

  /**
   * Get the icon/emoji for a font theme
   */
  function getThemeIcon(theme: FontTheme): string {
    const icons: Record<FontTheme, string> = {
      current: '✨',
      apple: '🍎',
      classic: '📜',
      modern: '🔷',
      luxury: '💎',
      elegant: '🎩',
      boutique: '👔',
    }
    return icons[theme]
  }

  /**
   * Get the description for a font theme
   */
  function getThemeDescription(theme: FontTheme): string {
    const descriptions: Record<FontTheme, string> = {
      current: 'Inter & Playfair Display',
      apple: 'SF Pro (System Fonts)',
      classic: 'EB Garamond & Lora',
      modern: 'Outfit & Montserrat',
      luxury: 'Cormorant & Raleway',
      elegant: 'Crimson Pro & Work Sans',
      boutique: 'Libre Baskerville & Nunito',
    }
    return descriptions[theme]
  }

  // Initialize theme on store creation
  if (currentTheme.value) {
    document.documentElement.setAttribute('data-font-theme', currentTheme.value)
  }

  // Watch for theme changes
  watch(currentTheme, (newTheme) => {
    document.documentElement.setAttribute('data-font-theme', newTheme)
  })

  return {
    currentTheme,
    setTheme,
    getThemeName,
    getThemeIcon,
    getThemeDescription,
  }
})
