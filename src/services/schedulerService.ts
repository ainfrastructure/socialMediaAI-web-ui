import type { ApiResponse } from './apiBase'
import { API_URL, getAuthHeader, getAuthHeaders } from './apiBase'

class SchedulerService {
  async getScheduledPosts(filters?: {
    status?: string
    month?: number
    year?: number
    platforms?: string[]
    restaurant_ids?: string[]
    business_ids?: string[]
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
    if (filters?.business_ids && filters.business_ids.length > 0) {
      params.append('business_ids', filters.business_ids.join(','))
    }

    const url = params.toString() ? `${API_URL}/api/scheduler?${params}` : `${API_URL}/api/scheduler`
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

  async getCalendar(
    month: number,
    year: number,
    businessIds?: string[]
  ): Promise<ApiResponse<{ calendar: any[] }>> {
    const params = new URLSearchParams()
    params.append('month', month.toString())
    params.append('year', year.toString())
    if (businessIds && businessIds.length > 0) {
      params.append('business_ids', businessIds.join(','))
    }

    const response = await fetch(
      `${API_URL}/api/scheduler/calendar?${params.toString()}`,
      {
        headers: getAuthHeader(),
      }
    )

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

  async getScheduledPost(id: string): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
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
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
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
      post_text?: string
      hashtags?: string[]
      favorite_post_id?: string
    }
  ): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
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

  async cancelScheduledPost(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}`, {
      method: 'DELETE',
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

  async retryScheduledPost(id: string): Promise<ApiResponse<{ scheduled_post_id: string; platforms: string[] }>> {
    const response = await fetch(`${API_URL}/api/scheduler/${id}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
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

  // Create a post entry with status='published' (for posts published immediately)
  async createPublishedPost(data: {
    favorite_post_id: string
    published_date: string
    published_time?: string
    platforms: string[]
    timezone?: string
    platform_post_urls?: Record<string, string>
    platform_settings?: any
    platform_results?: Array<{  // NEW
      platform: string
      success: boolean
      url?: string
      postId?: string
      error?: string
    }>
  }): Promise<ApiResponse<{ scheduled_post: any }>> {
    const response = await fetch(`${API_URL}/api/scheduler/published`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
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

  // Holidays
  async getHolidays(country: string, year: number): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays?country=${country}&year=${year}`,
      {
        headers: getAuthHeader(),
      }
    )

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

  async getHolidaysForMonth(
    country: string,
    year: number,
    month: number
  ): Promise<ApiResponse<{ holidays: any[] }>> {
    const response = await fetch(
      `${API_URL}/api/holidays/month?country=${country}&year=${year}&month=${month}`,
      {
        headers: getAuthHeader(),
      }
    )

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

  async getSupportedCountries(): Promise<ApiResponse<{ countries: { code: string; name: string }[] }>> {
    const response = await fetch(`${API_URL}/api/holidays/countries`, {
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
}

export const schedulerService = new SchedulerService()
