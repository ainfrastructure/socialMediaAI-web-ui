/** Types for the multi-platform post composer */

export type ComposerPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin'

export interface PlatformConfig {
  id: ComposerPlatform
  name: string
  icon: string
  maxChars: number
  maxHashtags: number
  maxImages: number
  supportedMediaTypes: Array<'image' | 'video' | 'carousel'>
  hashtagStyle: 'inline' | 'appended'
}

export interface ComposerPost {
  text: string
  hashtags: string[]
  images: File[]
  platformOverrides: Partial<Record<ComposerPlatform, { text: string }>>
}

export interface PlatformPreviewData {
  platform: ComposerPlatform
  text: string
  hashtags: string[]
  charCount: number
  maxChars: number
  isOverLimit: boolean
  imagePreviewUrls: string[]
}

export interface HashtagSuggestion {
  tag: string
  relevance: 'high' | 'medium' | 'low'
}
