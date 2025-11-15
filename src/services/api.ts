const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface User {
  id: string
  email: string
  subscription: {
    status: string
    tier: string
    current_period_end: string | null
    cancel_at_period_end: boolean
  }
  usage: {
    credits_this_month: number
    monthly_limit: number
    remaining_credits: number
  }
}

export interface LoginResponse {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: string
    email: string
  }
  session?: {
    access_token: string
    refresh_token: string
    expires_at?: number
    expires_in?: number
  }
  email_confirmation_required?: boolean
}

export interface SubscriptionPlan {
  tier: string
  name: string
  price: number
  formatted_price: string
  monthly_limit: number | string
  features: string[]
  stripe_price_id?: string
}

class ApiService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async signup(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return response.json()
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    })
    return response.json()
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async getPlans(): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/plans`)
    return response.json()
  }

  async createCheckout(
    tier: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<ApiResponse<{ checkout_url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        tier,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })
    return response.json()
  }

  async createPortalSession(returnUrl: string): Promise<ApiResponse<{ portal_url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ return_url: returnUrl }),
    })
    return response.json()
  }

  async generateImage(
    prompt: string,
    watermark?: { logoPath: string; position?: string; opacity?: number; scale?: number; padding?: number },
    referenceImage?: { base64Data: string; mimeType: string },
    promotionalSticker?: {
      text: string;
      position?: string;
      style?: string;
      color?: string;
      textColor?: string;
      size?: string;
      rotation?: number
    }
  ): Promise<ApiResponse<{ imageUrl: string; usage: any; watermarked?: boolean; promotionalStickerAdded?: boolean }>> {
    const response = await fetch(`${API_URL}/api/gemini/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ prompt, watermark, referenceImage, promotionalSticker }),
    })
    return response.json()
  }

  async sendMagicLink(email: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return response.json()
  }

  async updatePassword(password: string, token: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    })
    return response.json()
  }

  async verifyOtp(
    email: string,
    token: string,
    type: 'email' | 'magiclink' = 'email',
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, type }),
    })
    return response.json()
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    return response.json()
  }

  async syncSubscription(): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/subscriptions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    })
    return response.json()
  }

  // Video generation methods
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
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ prompt, ...options }),
    })
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
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ prompt, imageData, imageMimeType, ...options }),
    })
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
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  // Prompt generation
  async generatePrompts(
    restaurantData: any,
    menuItems?: any[],
    context?: string
  ): Promise<ApiResponse<{ imagePrompts: string[]; videoPrompts: string[] }>> {
    const response = await fetch(`${API_URL}/api/prompts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ restaurantData, menuItems, context }),
    })
    return response.json()
  }

  // Brand DNA analysis
  async analyzeBrandDNA(website: string, placeId?: string): Promise<ApiResponse<{ brandDNA: any }>> {
    const response = await fetch(`${API_URL}/api/brand-dna/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ website, placeId }),
    })
    return response.json()
  }

  async addVideoWatermark(
    videoPath: string,
    logoPath: string,
    options?: { position?: string; opacity?: number; scale?: number; padding?: number }
  ): Promise<ApiResponse<{ videoUrl: string }>> {
    const response = await fetch(`${API_URL}/api/images/add-video-watermark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        videoPath,
        logoPath,
        ...options,
      }),
    })
    return response.json()
  }

  // Post content generation
  async generatePostContent(
    platform: string,
    restaurantName: string,
    menuItems: string[],
    contentType: 'image' | 'video',
    context?: string,
    brandDNA?: any
  ): Promise<ApiResponse<{ postText: string; hashtags: string[]; callToAction: string }>> {
    const response = await fetch(`${API_URL}/api/post-content/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        platform,
        restaurantName,
        menuItems,
        contentType,
        context,
        brandDNA,
      }),
    })
    return response.json()
  }

  // Favorites
  async getFavorites(): Promise<ApiResponse<{ favorites: any[] }>> {
    const response = await fetch(`${API_URL}/api/favorites`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async getFavorite(id: string): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async saveFavorite(favoriteData: {
    restaurant_id?: string
    content_type: 'image' | 'video'
    media_url: string
    post_text?: string
    hashtags?: string[]
    call_to_action?: string
    platform?: string
    prompt?: string
    menu_items?: any[]
    context?: string
    brand_dna?: any
  }): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(favoriteData),
    })
    return response.json()
  }

  async updateFavorite(
    id: string,
    updates: {
      post_text?: string
      hashtags?: string[]
      call_to_action?: string
      platform?: string
    }
  ): Promise<ApiResponse<{ favorite: any }>> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(updates),
    })
    return response.json()
  }

  async deleteFavorite(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/favorites/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  // Scheduler
  async getScheduledPosts(filters?: {
    status?: string
    month?: number
    year?: number
  }): Promise<ApiResponse<{ scheduled_posts: any[] }>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.month) params.append('month', filters.month.toString())
    if (filters?.year) params.append('year', filters.year.toString())

    const url = params.toString() ? `${API_URL}/api/scheduler?${params}` : `${API_URL}/api/scheduler`
    const response = await fetch(url, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async getSchedulerCalendar(month: number, year: number): Promise<ApiResponse<{ calendar: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/scheduler/calendar?month=${month}&year=${year}`,
      {
        headers: this.getAuthHeader(),
      }
    )
    return response.json()
  }

  async getScheduledPost(id: string): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async schedulePost(scheduleData: {
    favorite_post_id: string
    scheduled_date: string
    scheduled_time?: string
    timezone?: string
    notes?: string
    platform_settings?: any
  }): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(scheduleData),
    })
    return response.json()
  }

  async updateScheduledPost(
    id: string,
    updates: {
      scheduled_date?: string
      scheduled_time?: string
      timezone?: string
      notes?: string
      platform_settings?: any
      status?: string
    }
  ): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(updates),
    })
    return response.json()
  }

  async cancelScheduledPost(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  // Holidays
  async getHolidays(country: string, year: number): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays?country=${country}&year=${year}`,
      {
        headers: this.getAuthHeader(),
      }
    )
    return response.json()
  }

  async getHolidaysForMonth(
    country: string,
    year: number,
    month: number
  ): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays/month?country=${country}&year=${year}&month=${month}`,
      {
        headers: this.getAuthHeader(),
      }
    )
    return response.json()
  }

  async getSupportedCountries(): Promise<ApiResponse<{ countries: { code: string; name: string }[] }>> {
    const response = await fetch(`${API_URL}/api/holidays/countries`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }
}

export const api = new ApiService()
