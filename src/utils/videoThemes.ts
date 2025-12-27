/**
 * Video Theme Context Helper
 *
 * Provides theme-specific context strings to enhance video generation prompts
 * with holiday or seasonal styling.
 *
 * Enhanced with video-aware dynamic elements including:
 * - Lighting dynamics (how light behaves and changes)
 * - Atmospheric elements (motion, particles, effects)
 * - Color grading (video-specific color treatment)
 * - Motion integration (how theme affects camera movement)
 *
 * Usage:
 * import { getVideoThemeModifier } from '@/utils/videoThemes'
 * const themeContext = getVideoThemeModifier('christmas')
 * enhancedPrompt = `${basePrompt}\n\n${themeContext}`
 */

export interface VideoThemeModifier {
  lightingDynamics: string
  atmosphericElements: string
  colorGrading: string
  motionIntegration: string
}

const VIDEO_THEME_MODIFIERS: Record<string, VideoThemeModifier> = {
  studentWeek: {
    lightingDynamics:
      'Casual bright lighting with energetic feel. Natural daylight or bright indoor lighting. Youthful, vibrant ambiance.',

    atmosphericElements:
      'Clean, modern environment. Fresh, approachable atmosphere. No excessive effects, just authentic student energy.',

    colorGrading:
      'Bright, saturated colors. High-key lighting with minimal shadows. Clean, crisp contrast for modern appeal.',

    motionIntegration:
      'Quick, dynamic camera movements. Energetic pacing. Fresh, accessible presentation style.'
  },

  christmas: {
    lightingDynamics:
      'Warm golden hour lighting with soft bokeh from twinkling lights in background. Gentle candlelight flicker creates subtle light variations. Shadows shift gently with camera movement.',

    atmosphericElements:
      'Subtle falling snow particles (gentle, not overwhelming). Rising steam catches warm backlight with magical quality. Soft glow from out-of-focus holiday lights creates depth.',

    colorGrading:
      'Warm color palette: rich golds, deep reds, forest greens. Slight warming filter on highlights for cozy feel. Crushed blacks for intimate atmosphere.',

    motionIntegration:
      'Camera movements slow and deliberate, conveying festive calm. Bokeh lights shift beautifully with angle changes, creating dynamic background interest.'
  },

  easter: {
    lightingDynamics:
      'Soft spring daylight with gentle diffusion. Pastel-tinted highlights create fresh, airy feel. Light bounces with delicate quality.',

    atmosphericElements:
      'Fresh seasonal flowers in soft focus background. Gentle breeze effects on light fabrics. Soft shadows that convey springtime renewal.',

    colorGrading:
      'Pastel color palette: soft pinks, yellows, lavenders, mint greens. Lifted blacks for airy feel. Soft, dreamy contrast.',

    motionIntegration:
      'Gentle, flowing camera movements. Slow reveals. Light, delicate pacing matches spring freshness.'
  },

  halloween: {
    lightingDynamics:
      'Moody low-key lighting with dramatic shadows. Orange and purple accent lights. Flickering candle effects create eerie atmosphere.',

    atmosphericElements:
      'Subtle mist or fog (low-lying). Steam rises ominously. Shadows play dramatically across surfaces with camera movement.',

    colorGrading:
      'Dark desaturated base with pops of orange, purple, deep red. Crushed blacks with lifted shadows for spooky feel.',

    motionIntegration:
      'Slow, creeping camera movements. Deliberate reveals. Suspenseful pacing with sudden reveals for impact.'
  },

  thanksgiving: {
    lightingDynamics:
      'Warm autumn lighting with golden hour quality. Rich amber tones. Cozy indoor lighting with warm practicals.',

    atmosphericElements:
      'Subtle seasonal elements (fall leaves in soft focus). Rising steam from warm dishes. Warm, inviting harvest atmosphere.',

    colorGrading:
      'Autumn color palette: burnt oranges, deep browns, golden yellows. Rich, warm tones throughout. Medium contrast for cozy feel.',

    motionIntegration:
      'Steady, comforting camera movements. Deliberate reveals. Warm, welcoming pacing conveys abundance and gratitude.'
  },

  valentines: {
    lightingDynamics:
      'Romantic soft lighting with warm pink/red accent lights. Gentle bokeh from candles. Flattering diffused key light.',

    atmosphericElements:
      'Soft focus edges (romantic diffusion). Rising steam catches pink-tinted backlight. Subtle sparkle or shimmer effects.',

    colorGrading:
      'Warm romantic palette: soft pinks, reds, golds. Slightly lifted blacks for dreamy feel. Soft, flattering contrast.',

    motionIntegration:
      'Languid, sensual camera movements. Slow reveals. Intimate pacing invites romance and connection.'
  },

  summer: {
    lightingDynamics:
      'Bright natural daylight with high-key exposure. Strong crisp highlights with airy shadows. Light bounces and reflects creating vibrant, energetic feel.',

    atmosphericElements:
      'Subtle heat shimmer (if warm dish). Condensation beads on cold beverages. Crisp shadows that shift with camera movement.',

    colorGrading:
      'Saturated vibrant colors - greens, yellows, blues pop. Bright whites with slight overexposure for sunny feel. Clean, crisp high contrast.',

    motionIntegration:
      'Energetic camera movements. Quick reveals and transitions. Fresh, dynamic pacing matches bright summer energy.'
  },

  newYear: {
    lightingDynamics:
      'Festive sparkle lighting with dynamic highlights. Metallic reflections and shimmer. Champagne bubbles catch light beautifully.',

    atmosphericElements:
      'Subtle confetti or sparkle particles. Celebratory atmosphere with dynamic light play. Effervescent energy.',

    colorGrading:
      'Celebratory palette: golds, silvers, champagne hues. Bright highlights with rich shadows. High-contrast glamour.',

    motionIntegration:
      'Dynamic camera movements with energy. Quick transitions. Celebratory pacing with festive momentum.'
  }
}

/**
 * Get video-aware theme modifier with dynamic lighting and motion elements
 */
export function getVideoThemeModifier(theme: string): string {
  const themeData = VIDEO_THEME_MODIFIERS[theme]
  if (!themeData) return ''

  return `ATMOSPHERE: ${themeData.lightingDynamics} ${themeData.atmosphericElements} ${themeData.colorGrading} ${themeData.motionIntegration}`
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getVideoThemeModifier for enhanced video themes
 */
export function getThemeContext(theme: string): string {
  const themeContexts: Record<string, string> = {
    studentWeek: 'Style: Student-friendly casual atmosphere with youthful energy',
    christmas:
      'Style: Festive Christmas atmosphere with warm holiday lighting and seasonal decorations',
    easter: 'Style: Spring atmosphere with pastel colors and fresh seasonal elements',
    halloween: 'Style: Spooky Halloween atmosphere with orange/black color scheme',
    thanksgiving: 'Style: Warm autumn harvest atmosphere with fall colors',
    valentines: "Style: Romantic Valentine's Day atmosphere with red/pink accents",
    summer: 'Style: Bright summery atmosphere with vibrant fresh colors',
    newYear: 'Style: Celebratory New Year atmosphere with festive sparkle',
  }
  return themeContexts[theme] || ''
}
