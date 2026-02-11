/**
 * Brand Voice Configuration types
 * Used by BrandVoiceSettings component and AI content generation
 */

export interface ToneSettings {
  formality: number
  humor: number
  technicality: number
  enthusiasm: number
}

export interface PlatformOverride {
  enabled: boolean
  toneAdjustments: Partial<ToneSettings>
}

export interface BrandVoiceConfig {
  toneMatrix: ToneSettings
  keywords: {
    include: string[]
    exclude: string[]
  }
  voiceSamples: string[]
  platformOverrides: Record<string, PlatformOverride>
}
