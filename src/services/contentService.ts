import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class ContentService {
  // Image generation
  async generateImage(
    prompt: string | null, // Can be null if using dishInfo
    watermark?: { logoPath: string; position?: string; opacity?: number; scale?: number; padding?: number },
    referenceImage?: { base64Data: string; mimeType: string },
    promotionalSticker?: {
      text: string
      position?: string
      style?: string
      color?: string
      textColor?: string
      size?: string
      rotation?: number
    },
    placeId?: string,
    strictnessMode?: 'strict' | 'flexible' | 'creative',
    holidayTheme?: string,
    visualStyle?: 'behindTheScenes' | 'cleanStrict' | 'zoomIn' | 'oneBite' | 'studioShot' | 'infographic' | 'placeOnTable' | 'custom',
    customPrompt?: string,
    dishInfo?: { name: string; description?: string } | string,
    brandName?: string
  ): Promise<ApiResponse<{ imageUrl: string; usage: any; watermarked?: boolean; promotionalStickerAdded?: boolean }>> {
    console.log('[ContentService] Generating image with placeId:', placeId)
    const response = await fetch(`${API_URL}/api/gemini/generate-image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, watermark, referenceImage, promotionalSticker, placeId, strictnessMode, holidayTheme, visualStyle, customPrompt, dishInfo, brandName }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    const result = await response.json()
    console.log('[ContentService] Image generation result:', result)
    return result
  }

  // Video generation
  async generateVideo(
    prompt: string,
    options?: {
      model?: 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview'
      duration?: 4 | 6 | 8
      aspectRatio?: '16:9' | '9:16'
      resolution?: '720p' | '1080p'
      negativePrompt?: string
      enhancePrompt?: boolean
      generateAudio?: boolean
      personGeneration?: 'allow_adult' | 'dont_allow'
    }
  ): Promise<ApiResponse<{ operationId: string; usage: any }>> {
    const response = await fetch(`${API_URL}/api/veo/generate-video`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, ...options }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async generateVideoFromImage(
    prompt: string,
    imageData: string,
    imageMimeType: string,
    options?: {
      model?: 'veo-3.1-generate-preview' | 'veo-3.1-fast-generate-preview'
      duration?: 4 | 6 | 8
      aspectRatio?: '16:9' | '9:16'
      resolution?: '720p' | '1080p'
      negativePrompt?: string
      enhancePrompt?: boolean
      generateAudio?: boolean
      personGeneration?: 'allow_adult' | 'dont_allow'
    }
  ): Promise<ApiResponse<{ operationId: string; usage: any }>> {
    const response = await fetch(`${API_URL}/api/veo/generate-video-from-image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, imageData, imageMimeType, ...options }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async pollVideoOperation(
    operationId: string,
    modelId?: string
  ): Promise<ApiResponse<{ operation: any }>> {
    const url = modelId
      ? `${API_URL}/api/veo/operation/${operationId}?modelId=${modelId}`
      : `${API_URL}/api/veo/operation/${operationId}`
    const response = await fetch(url, {
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  // Prompt generation
  async generatePrompts(
    brandData: any,
    menuItems?: any[],
    context?: string
  ): Promise<ApiResponse<{ imagePrompts: string[]; videoPrompts: string[] }>> {
    const response = await fetch(`${API_URL}/api/prompts/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ restaurantData: brandData, menuItems, context }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  // Advanced mode: Generate 4 style variations
  async generateStyleVariations(
    brandData: any,
    menuItems: any[],
    customization?: any,
    postTypeOptions?: {
      postType: 'single' | 'combo' | 'weekly'
      weekLength?: 5 | 7
      includeWeeklyPrices?: boolean
      weeklyMenuData?: Array<{
        day: string
        dayKey: string
        dishName: string
        price?: string
        imageUrl?: string
      }>
      weeklyCustomization?: {
        layout: 'verticalStack' | 'gridWithHeader' | 'calendarGrid' | 'filmstrip'
        showDates: boolean
        dateFormat: 'full' | 'short' | 'dayOnly'
        showWeekNumber: boolean
        showMonthName: boolean
        startDate?: string
        endDate?: string
        theme: string
        customThemeText?: string
      }
    }
  ): Promise<{ success: boolean; variations?: any[]; error?: string }> {
    const response = await fetch(`${API_URL}/api/prompts/generate-style-variations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ restaurantData: brandData, menuItems, customization, postTypeOptions }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  // Advanced mode: Generate image with advanced customization
  async generateAdvancedImage(
    prompt: string,
    customization: any,
    menuItems: any[],
    brandLogoPath?: string,
    placeId?: string,
    postTypeOptions?: {
      postType: 'single' | 'combo' | 'weekly'
      weekLength?: 5 | 7
      includeWeeklyPrices?: boolean
      weeklyMenuData?: Array<{
        day: string
        dayKey: string
        dishName: string
        price?: string
        imageUrl?: string
      }>
      weeklyCustomization?: {
        layout: 'verticalStack' | 'gridWithHeader' | 'calendarGrid' | 'filmstrip'
        showDates: boolean
        dateFormat: 'full' | 'short' | 'dayOnly'
        showWeekNumber: boolean
        showMonthName: boolean
        startDate?: string
        endDate?: string
        theme: string
        customThemeText?: string
      }
    },
    referenceImage?: { base64Data: string; mimeType: string }
  ): Promise<ApiResponse<{ imageUrl: string; textOverlayAdded: boolean; customization: any }>> {
    const response = await fetch(`${API_URL}/api/images/generate-advanced`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, customization, menuItems, restaurantLogoPath: brandLogoPath, placeId, postTypeOptions, referenceImage }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async addVideoWatermark(
    videoPath: string,
    logoPath: string,
    options?: { position?: string; opacity?: number; scale?: number; padding?: number }
  ): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
    const response = await fetch(`${API_URL}/api/images/add-video-watermark`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ videoPath, logoPath, ...options }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  async addVideoPromotionalSticker(
    videoPath: string,
    text: string,
    options?: { position?: string; style?: string; color?: string; textColor?: string; size?: string; rotation?: number }
  ): Promise<{ success: boolean; videoUrl?: string; error?: string }> {
    const response = await fetch(`${API_URL}/api/images/add-video-promotional-sticker`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ videoPath, text, ...options }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }

  // Post content generation
  async generatePostContent(
    platform: string,
    brandName: string,
    menuItems: Array<string | { name: string; description?: string }>,
    contentType: 'image' | 'video',
    context?: string,
    brandDNA?: any,
    language?: 'en' | 'no'
  ): Promise<ApiResponse<{ postText: string; hashtags: string[] }>> {
    const response = await fetch(`${API_URL}/api/post-content/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        platform,
        brandName,
        menuItems,
        contentType,
        context,
        brandDNA,
        language,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        return {
          success: false,
          error: `HTTP ${response.status}: ${text || response.statusText}`
        }
      }
    }

    return response.json()
  }
}

export const contentService = new ContentService()
