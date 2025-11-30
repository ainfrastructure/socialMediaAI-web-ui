const API_URL = import.meta.env.VITE_API_URL || ''

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface User {
  id: string
  email: string
  has_completed_onboarding?: boolean
  accepted_terms_at?: string | null
  onboarding_completed_at?: string | null
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

  async completeOnboarding(): Promise<ApiResponse<{ user: User }>> {
    const response = await fetch(`${API_URL}/api/auth/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    })
    return response.json()
  }

  async getStats(): Promise<ApiResponse<{
    postsCreated: number
    favoritesSaved: number
    scheduledPosts: number
    restaurantsAdded: number
  }>> {
    const response = await fetch(`${API_URL}/api/auth/stats`, {
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

  async createCustomerPortal(returnUrl?: string): Promise<ApiResponse<{ url: string }>> {
    const response = await fetch(`${API_URL}/api/subscriptions/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({
        return_url: returnUrl || `${window.location.origin}/profile`,
      }),
    })
    const data = await response.json()
    // Map portal_url to url for compatibility
    if (data.success && data.data?.portal_url) {
      return { ...data, data: { url: data.data.portal_url } }
    }
    return data
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
    },
    placeId?: string
  ): Promise<ApiResponse<{ imageUrl: string; usage: any; watermarked?: boolean; promotionalStickerAdded?: boolean }>> {
    console.log('[API] Calling /api/gemini/generate-image with:', {
      prompt: prompt.substring(0, 50) + '...',
      hasWatermark: !!watermark,
      hasReferenceImage: !!referenceImage,
      hasPromotionalSticker: !!promotionalSticker,
      placeId
    })
    const response = await fetch(`${API_URL}/api/gemini/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ prompt, watermark, referenceImage, promotionalSticker, placeId }),
    })
    const data = await response.json()
    console.log('[API] Response from /api/gemini/generate-image:', {
      success: data.success,
      hasImageUrl: !!data.imageUrl,
      hasDataImageUrl: !!data.data?.imageUrl,
      imageUrl: data.imageUrl || data.data?.imageUrl || 'NOT FOUND',
      topLevelKeys: Object.keys(data)
    })
    return data
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

  // Advanced mode: Generate 4 style variations
  async generateStyleVariations(
    restaurantData: any,
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
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ restaurantData, menuItems, customization, postTypeOptions }),
    })
    return response.json()
  }

  // Advanced mode: Generate image with advanced customization
  async generateAdvancedImage(
    prompt: string,
    customization: any,
    menuItems: any[],
    restaurantLogoPath?: string,
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
    }
  ): Promise<ApiResponse<{ imageUrl: string; textOverlayAdded: boolean; customization: any }>> {
    const response = await fetch(`${API_URL}/api/images/generate-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ prompt, customization, menuItems, restaurantLogoPath, placeId, postTypeOptions }),
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

  // Facebook OAuth methods
  async initFacebookAuth(): Promise<ApiResponse<{ authUrl: string; state: string }>> {

    const response = await fetch(`${API_URL}/api/facebook/auth/init`, {
      headers: this.getAuthHeader(),
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

    const data = await response.json()

    return data
  }

  async completeFacebookAuth(
    code: string,
    state: string
  ): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetch(`${API_URL}/api/facebook/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ code, state }),
    })
    return response.json()
  }

  async getFacebookPages(): Promise<ApiResponse<{ pages: any[] }>> {
    const response = await fetch(`${API_URL}/api/facebook/pages`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async disconnectFacebookPage(pageId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/facebook/pages/${pageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async postToFacebook(
    pageId: string,
    message: string,
    imageUrl?: string
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    const response = await fetch(`${API_URL}/api/facebook/pages/${pageId}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ message, imageUrl }),
    })
    return response.json()
  }

  async uploadFacebookImage(file: File): Promise<ApiResponse<{ imageUrl: string; imageId: string; width: number; height: number }>> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/api/facebook/upload-image`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
      },
      body: formData,
    })
    return response.json()
  }

  async getPostHistory(pageId?: string): Promise<ApiResponse<{ posts: any[] }>> {
    const url = pageId
      ? `${API_URL}/api/facebook/posts?pageId=${encodeURIComponent(pageId)}`
      : `${API_URL}/api/facebook/posts`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...this.getAuthHeader(),
      },
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
    brandDNA?: any,
    language?: 'en' | 'no'
  ): Promise<ApiResponse<{ postText: string; hashtags: string[] }>> {
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
        language,
      }),
    })
    return response.json()
  }

  // Favorites
  async getFavorites(filters?: {
    platform?: string
    restaurant_id?: string
    content_type?: 'image' | 'video'
    limit?: number
    offset?: number
    sort?: 'newest' | 'oldest'
  }): Promise<ApiResponse<{ favorites: any[]; pagination: { total: number; limit: number; offset: number; totalPages: number } }>> {
    const params = new URLSearchParams()
    if (filters?.platform) params.append('platform', filters.platform)
    if (filters?.restaurant_id) params.append('restaurant_id', filters.restaurant_id)
    if (filters?.content_type) params.append('content_type', filters.content_type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.sort) params.append('sort', filters.sort)

    const url = params.toString() ? `${API_URL}/api/favorites?${params}` : `${API_URL}/api/favorites`
    const response = await fetch(url, {
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
    platforms?: string[]
    restaurant_ids?: string[]
  }): Promise<ApiResponse<{ scheduled_posts: any[] }>> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.month) params.append('month', filters.month.toString())
    if (filters?.year) params.append('year', filters.year.toString())

    // Handle array parameters - send as comma-separated
    if (filters?.platforms && filters.platforms.length > 0) {
      params.append('platforms', filters.platforms.join(','))
    }
    if (filters?.restaurant_ids && filters.restaurant_ids.length > 0) {
      params.append('restaurant_ids', filters.restaurant_ids.join(','))
    }

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
    platforms: string[]
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
      platforms?: string[]
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

  // Create a post entry with status='published' (for posts published immediately)
  async createPublishedPost(data: {
    favorite_post_id: string
    published_date: string
    published_time?: string
    platforms: string[]
    timezone?: string
    platform_post_urls?: Record<string, string>
  }): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/published`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(data),
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

  // Instagram OAuth methods
  async initInstagramAuth(): Promise<ApiResponse<{ authUrl: string; state: string }>> {
    const response = await fetch(`${API_URL}/api/instagram/auth/init`, {
      headers: this.getAuthHeader(),
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

  async completeInstagramAuth(
    code: string,
    state: string
  ): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetch(`${API_URL}/api/instagram/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ code, state }),
    })
    return response.json()
  }

  async getInstagramAccounts(): Promise<ApiResponse<{ accounts: any[] }>> {
    const response = await fetch(`${API_URL}/api/instagram/accounts`, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async disconnectInstagramAccount(accountId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  async postToInstagram(
    accountId: string,
    caption: string,
    imageUrl: string
  ): Promise<ApiResponse<{ postId: string; postUrl: string }>> {
    const response = await fetch(`${API_URL}/api/instagram/accounts/${accountId}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ caption, imageUrl }),
    })
    return response.json()
  }

  // Restaurants
  async getRestaurants(limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())

    const url = params.toString() ? `${API_URL}/api/restaurants?${params}` : `${API_URL}/api/restaurants`
    const response = await fetch(url, {
      headers: this.getAuthHeader(),
    })
    return response.json()
  }

  // Waitlist (public endpoints, no auth required)
  async joinWaitlist(
    email: string,
    metadata?: { locale?: string; timezone?: string; referrer?: string }
  ): Promise<ApiResponse<{ count: number }>> {
    const response = await fetch(`${API_URL}/api/waitlist/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        locale: metadata?.locale || navigator.language,
        timezone: metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: metadata?.referrer || document.referrer,
      }),
    })
    return response.json()
  }

  async getWaitlistCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await fetch(`${API_URL}/api/waitlist/count`)
    return response.json()
  }
}

export const api = new ApiService()
